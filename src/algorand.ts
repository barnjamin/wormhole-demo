import {
  ChainId,
  CHAIN_ID_ALGORAND,
  attestFromAlgorand,
  transferFromAlgorand,
  redeemOnAlgorand,
  parseSequenceFromLogAlgorand,
  getEmitterAddressAlgorand,
  nativeToHexString,
  getIsTransferCompletedAlgorand,
} from "@certusone/wormhole-sdk";
import { TransactionSignerPair } from "@certusone/wormhole-sdk/lib/cjs/algorand";
import algosdk, { Algodv2, Transaction, waitForConfirmation } from "algosdk";
import {
  AlgorandSigner,
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeMessage,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";

export function getAlgoClient(): Algodv2 {
  const token = "";
  const server = "https://testnet-api.algonode.cloud";
  return new Algodv2(token, server);
}

export async function signSendWait(
  client: Algodv2,
  txns: TransactionSignerPair[],
  acct: AlgorandSigner
): Promise<any[]> {
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

  const txids = txns.map((tx) => tx.tx.txID());

  await client.sendRawTransaction(signedTxns).do();

  return Promise.all(
    txids.map((txid) => {
      waitForConfirmation(client, txid, 2);
    })
  );
}

export class Algorand implements WormholeChain {
  coreId: bigint = BigInt(5);
  tokenBridgeId: bigint = BigInt(6);

  id: ChainId = CHAIN_ID_ALGORAND;

  client: Algodv2;

  constructor() {
    this.client = getAlgoClient();
  }

  emitterAddress(): string {
    return getEmitterAddressAlgorand(this.coreId);
  }

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (typeof attestation.origin.contract !== "bigint")
      throw new Error("Expected bigint for asset, got string");

    const txs = await attestFromAlgorand(
      this.client,
      this.tokenBridgeId,
      this.coreId,
      await attestation.sender.getAddress(),
      attestation.origin.contract
    );

    const result = await signSendWait(
      this.client,
      txs,
      attestation.sender as AlgorandSigner
    );
    return parseSequenceFromLogAlgorand(result);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if (typeof msg.origin.contract !== "bigint")
      throw new Error("Expected bigint for asset, got string");

    const hexStr = nativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );
    if (!hexStr) throw new Error("Failed to convert to hexStr");

    const fee = 0;

    const transferTxs = await transferFromAlgorand(
      this.client,
      this.tokenBridgeId,
      this.coreId,
      await msg.sender.getAddress(),
      msg.origin.contract,
      msg.amount,
      hexStr,
      msg.destination.chain.id,
      BigInt(fee)
    );

    const transferResult = await signSendWait(
      this.client,
      transferTxs,
      msg.sender as AlgorandSigner
    );
    return parseSequenceFromLogAlgorand(transferResult);
  }

  async redeem(
    signer: AlgorandSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const redeemTxs = await redeemOnAlgorand(
      this.client,
      this.tokenBridgeId,
      this.coreId,
      receipt.VAA,
      signer.getAddress()
    );
    const result = await signSendWait(this.client, redeemTxs, signer);
    //TODO: find asset id from resulting txids
    return { chain: this, contract: BigInt(0) } as WormholeAsset;
  }

  createWrapped(
    signer: AlgorandSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    throw new Error("Method not implemented.");
  }

  updateWrapped(
    signer: AlgorandSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    throw new Error("Method not implemented.");
  }

  async transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    return await getIsTransferCompletedAlgorand(
      this.client,
      this.tokenBridgeId,
      receipt.VAA
    );
  }
}
