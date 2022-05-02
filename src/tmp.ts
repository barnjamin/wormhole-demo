import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import { ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import algosdk, {
  Account,
  decodeAddress,
  getApplicationAddress,
  makeApplicationCallTxnFromObject,
  OnApplicationComplete,
  waitForConfirmation,
  Algodv2,
} from "algosdk";
import {
  parseSequenceFromLogAlgorand,
  getEmitterAddressAlgorand,
  getSignedVAAWithRetry,

  // Algo
  attestFromAlgorand,

  // Eth
  createWrappedOnEth,
  updateWrappedOnEth,
  getForeignAssetEth,
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_ETH,
  hexToUint8Array,
  TokenImplementation__factory,
  nativeToHexString,
  transferFromAlgorand,
  uint8ArrayToHex,
  getIsTransferCompletedEth,
  redeemOnEth,
  getEmitterAddressEth,
  approveEth,
  transferFromEth,
  redeemOnAlgorand,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";

import { WORMHOLE_RPC_HOSTS } from "./consts";
import { _parseVAAAlgorand } from "@certusone/wormhole-sdk/lib/cjs/algorand";

const CORE_ID = BigInt(5);
const TOKEN_BRIDGE_ID = BigInt(6);

//setDefaultWasm("node");


interface Signer {
  addr: string;
  signTxn(txn: algosdk.Transaction): Promise<Uint8Array>;
}

interface TransactionSignerPair {
  tx: algosdk.Transaction;
  signer: Signer | null;
}

function getAlgoClient(): Algodv2 {
  const token = "";
  const server = "";
  const port = 4001;
  return new Algodv2(token, server, port);
}

function getEthProvider(): any {
  const ETH_NODE_URL = "";
  return new ethers.providers.WebSocketProvider(ETH_NODE_URL) as any;
}

function getTempAccounts() {
  return [algosdk.generateAccount(), algosdk.generateAccount()];
}

const ETH_TOKEN_BRIDGE_ADDRESS = "0x0290FB167208Af455bB137780163b7B7a9a10C16";

async function signSendWait(
  client: Algodv2,
  txns: TransactionSignerPair[],
  acct: Signer
) {
  algosdk.assignGroupID(
    txns.map((tx) => {
      return tx.tx;
    })
  );

  const signedTxns: Uint8Array[] = [];
  for (const tx of txns) {
    if (tx.signer) {
      signedTxns.push(await tx.signer.signTxn(tx.tx));
    } else {
      signedTxns.push(await acct.signTxn(tx.tx));
    }
  }

  await client.sendRawTransaction(signedTxns).do();

  const result = await waitForConfirmation(
    client,
    txns[txns.length - 1].tx.txID(),
    1
  );

  return result;
}

function getEthSigner(provider: any) {
  const ETH_PRIVATE_KEY =
    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

async function createOrUpdateEth(vaa: Uint8Array) {
  const signer = getEthSigner(getEthProvider());

  try {
    await createWrappedOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, vaa);
    return;
  } catch (e) {
    console.log("createWrappedOnEth() failed.  Trying updateWrappedOnEth()...");
  }

  try {
    await updateWrappedOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, vaa);
  } catch (e) {
    console.error("failed to updateWrappedOnEth", e);
  }
}

async function createOrUpdate(chain: ChainId, vaa: Uint8Array) {
  switch (chain) {
    case CHAIN_ID_ETH:
      createOrUpdateEth(vaa);
  }
}

async function redeem(chain: ChainId, signedVaa: any) {
  const provider = getEthProvider();
  const signer = getEthSigner(provider);
  switch (chain) {
    case CHAIN_ID_ETH:
      await redeemOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, signedVaa.vaaBytes);
      await getIsTransferCompletedEth(
        ETH_TOKEN_BRIDGE_ADDRESS,
        provider,
        signedVaa.vaaBytes
      );
  }
}

async function transfer(from: Signer, foreignAsset: string, amount: bigint, chain: ChainId): Promise<Uint8Array> {

   const provider = getEthProvider();
   const signer = getEthSigner(provider);

  await approveEth(ETH_TOKEN_BRIDGE_ADDRESS, foreignAsset, signer, amount.toString());

  const receipt = await transferFromEth(
    ETH_TOKEN_BRIDGE_ADDRESS,
    signer,
    foreignAsset,
    amount.toString(),
    CHAIN_ID_ALGORAND,
    decodeAddress(from.addr).publicKey
  );

  const sequence = parseSequenceFromLogEth(receipt, ETH_TOKEN_BRIDGE_ADDRESS);
  const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS);

  // poll until the guardian(s) witness and sign the vaa
  console.log("About to getSignedVAA...");
  const { vaaBytes: signedVAA } = await getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS,
    CHAIN_ID_ETH,
    emitterAddress,
    sequence,
    {
      transport: NodeHttpTransport(),
    }
  );

  return signedVAA
}

async function attestForAlgoAsset(asset: bigint, from: Signer, chain: ChainId) {
  const client: algosdk.Algodv2 = getAlgoClient();

  const txs = await attestFromAlgorand(
    client,
    TOKEN_BRIDGE_ID,
    CORE_ID,
    from.addr,
    asset
  );
  const result = await signSendWait(client, txs, from);
  const sn = parseSequenceFromLogAlgorand(result);

  console.log("Getting emitter address...");
  const emitterAddr = getEmitterAddressAlgorand(TOKEN_BRIDGE_ID);
  const { vaaBytes } = await getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS,
    CHAIN_ID_ALGORAND,
    emitterAddr,
    sn,
    { transport: NodeHttpTransport() }
  );

  createOrUpdate(chain, vaaBytes);
}

async function xferFromAlgo(
  asset: bigint,
  from: Signer,
  to: Signer,
  amount: bigint,
  chain: ChainId
) {

  const client = getAlgoClient();

  const hexStr = nativeToHexString(to.addr, chain);
  if (!hexStr) {
    throw new Error("Failed to convert to hexStr");
  }
  const transferTxs = await transferFromAlgorand(
    client,
    TOKEN_BRIDGE_ID,
    CORE_ID,
    from.addr,
    asset,
    amount,
    hexStr,
    chain,
    BigInt(0)
  );

  const transferResult = await signSendWait(client, transferTxs, from);

  const txSid = parseSequenceFromLogAlgorand(transferResult);
  const emitterAddr = getEmitterAddressAlgorand(TOKEN_BRIDGE_ID);

  const signedVaa = await getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS,
    CHAIN_ID_ALGORAND,
    emitterAddr,
    txSid,
    { transport: NodeHttpTransport() }
  );

  await redeem(chain, signedVaa);
}

async function xferToAlgo(asset: string, from: Signer, to: Signer, amount: bigint, chain: ChainId) {

  const signedVAA = await transfer(from, asset, amount, chain)

  const client = getAlgoClient()

  const redeemTxs = await redeemOnAlgorand(
    client,
    TOKEN_BRIDGE_ID,
    CORE_ID,
    signedVAA,
    to.addr
  );
  await signSendWait(client, redeemTxs, to);

}

