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
  WormholeWrappedInfo,
  getForeignAssetAlgorand,
  getOriginalAssetAlgorand,
  createWrappedOnAlgorand,
} from "@certusone/wormhole-sdk";
import { TransactionSignerPair } from "@certusone/wormhole-sdk/lib/cjs/algorand";
import algosdk, { Algodv2, generateAccount, waitForConfirmation } from "algosdk";
import {
  ALGORAND_BRIDGE_ID,
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
} from "./consts";
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
): Promise<any[]> {
  const txs = txns.map((tx) => {
    return tx.tx;
  });
  algosdk.assignGroupID(txs);

  const signedTxns: Uint8Array[] = [];
  for (const idx in txns) {
    const txn = txns[idx];
    const tx = txs[idx];
    if (txn.signer) {
      signedTxns.push(await txn.signer.signTxn(tx));
    } else {
      signedTxns.push(await acct.signTxn(tx));
    }
  }

  const txids = txs.map((tx) => tx.txID());

  await client.sendRawTransaction(signedTxns).do();

  const results = await Promise.all(
    txids.map(async (txid) => {
      console.log(txid);
      return await waitForConfirmation(client, txid, 2);
    })
  );
  console.log(results);
  return results;
}

export class Algorand implements WormholeChain {
  coreId: bigint = BigInt(ALGORAND_BRIDGE_ID);
  tokenBridgeId: bigint = BigInt(ALGORAND_TOKEN_BRIDGE_ID);

  id: ChainId = CHAIN_ID_ALGORAND;

  client: Algodv2;

  constructor() {
    const { algodToken, algodServer, algodPort } = ALGORAND_HOST;
    this.client = new Algodv2(algodToken, algodServer, algodPort);
  }
  async lookupOriginal(asset: bigint): Promise<WormholeWrappedInfo> {
    return getOriginalAssetAlgorand(
      this.client,
      this.tokenBridgeId,
      asset
    );
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

    return { chain: this, contract: fa } as WormholeAsset
  }

  emitterAddress(): string {
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
    return parseSequenceFromLogAlgorand(result[result.length - 1]);
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
    return parseSequenceFromLogAlgorand(transferResult[transferResult.length - 1]);
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
      const results = await signSendWait(this.client, txs, signer)
      console.log(results)
      for(const result in results){
        // Find created asset id
      }

      return {} as WormholeAsset
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
  getAssetAsString(asset: bigint): string {
    return ("0".repeat(64) + asset.toString()).slice(-64);
  }

  getAssetAsInt(asset: string): bigint {
    return BigInt(0)
  }

}
