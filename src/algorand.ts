import {
  ChainId,
  CHAIN_ID_ALGORAND,
  attestFromAlgorand,
  transferFromAlgorand,
  redeemOnAlgorand,
  parseSequenceFromLogAlgorand,
  getEmitterAddressAlgorand,
  getIsTransferCompletedAlgorand,
  WormholeWrappedInfo,
  getForeignAssetAlgorand,
  getOriginalAssetAlgorand,
  createWrappedOnAlgorand,
  tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import { TransactionSignerPair } from "@certusone/wormhole-sdk/lib/cjs/algorand";
import algosdk, {
  Algod,
  Algodv2,
  generateAccount,
  waitForConfirmation,
} from "algosdk";
import {
  ALGORAND_BRIDGE_ID,
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
} from "./consts";
import { isSolSigner } from "./solana";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";

export class AlgorandSigner {
  account: algosdk.Account;

  constructor(acct?: algosdk.Account) {
    this.account = acct === undefined ? generateAccount() : acct;
  }

  getAddress(): string {
    return this.account.addr;
  }

  async signTxn(txn: algosdk.Transaction): Promise<Uint8Array> {
    return txn.signTxn(this.account.sk);
  }
}

export async function signSendWait(
  client: Algodv2,
  txns: TransactionSignerPair[],
  acct: AlgorandSigner
): Promise<any> {

  // Signer empty, take just tx
  const txs = txns.map((tx) => {
    return tx.tx;
  });

  // Group txns atomically
  algosdk.assignGroupID(txs);

  // Take the last txns id
  const txid: string = txs[txs.length - 1].txID();

  const signedTxns: Uint8Array[] = await Promise.all(
    txns.map(async (tx) => {
      if (tx.signer) {
        return await tx.signer.signTxn(tx.tx);
      } else {
        return await acct.signTxn(tx.tx);
      }
    })
  );

  await client.sendRawTransaction(signedTxns).do();

  return await waitForConfirmation(client, txid, 2);
}

export class Algorand implements WormholeChain {
  coreId: bigint = BigInt(ALGORAND_BRIDGE_ID);
  tokenBridgeId: bigint = BigInt(ALGORAND_TOKEN_BRIDGE_ID);

  id: ChainId = CHAIN_ID_ALGORAND;

  client: Algodv2;

  constructor(client: Algodv2) {
    this.client = client
  }
  async lookupOriginal(asset: bigint): Promise<WormholeWrappedInfo> {
    return getOriginalAssetAlgorand(this.client, this.tokenBridgeId, asset);
  }

  async lookupMirrored(
    asset: string,
    chain: WormholeChain
  ): Promise<WormholeAsset> {
    const fa = await getForeignAssetAlgorand(
      this.client,
      this.tokenBridgeId,
      chain.id,
      asset
    );

    return { chain: this, contract: fa } as WormholeAsset;
  }

  async emitterAddress(): Promise<string> {
    return getEmitterAddressAlgorand(this.tokenBridgeId);
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

    // Parse only the last one since it'll have the logged message
    return parseSequenceFromLogAlgorand(result);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if (typeof msg.origin.contract !== "bigint")
      throw new Error("Expected bigint for asset, got string");

    let rcv = await msg.receiver.getAddress();

    if (
      isSolSigner(msg.receiver) &&
      typeof msg.destination.contract == "string"
    ) {
      const pk = await msg.receiver.getTokenAddress(msg.destination.contract);
      rcv = pk.toString();
    }

    const hexStr = tryNativeToHexString(rcv, msg.destination.chain.id);
    if (!hexStr) throw new Error("Failed to convert to hexStr");

    const fee = 0;

    console.time("Creating transactions");
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
    console.timeEnd("Creating transactions");

    console.time("Signing and sending");
    const result = await signSendWait(
      this.client,
      transferTxs,
      msg.sender as AlgorandSigner
    );
    console.timeEnd("Signing and sending");
    return parseSequenceFromLogAlgorand(result);
  }

  async redeem(
    signer: AlgorandSigner,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    console.time("Creating Redeem txns");
    const redeemTxs = await redeemOnAlgorand(
      this.client,
      this.tokenBridgeId,
      this.coreId,
      receipt.VAA,
      signer.getAddress()
    );
    console.timeEnd("Creating Redeem txns");
    console.time("Signing and sending");
    await signSendWait(this.client, redeemTxs, signer);
    console.timeEnd("Signing and sending");

    return asset;
  }

  async createWrapped(
    signer: AlgorandSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const txs = await createWrappedOnAlgorand(
      this.client,
      this.tokenBridgeId,
      this.coreId,
      signer.getAddress(),
      receipt.VAA
    );
    await signSendWait(this.client, txs, signer);

    return {} as WormholeAsset;
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
  getAssetAsString(asset: bigint | string): string {
    if (typeof asset == "string") return asset;
    return ("0".repeat(64) + asset.toString()).slice(-64);
  }

  getAssetAsInt(asset: string): bigint {
    return BigInt(0);
  }
}
