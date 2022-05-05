import {
  ChainId,
  CHAIN_ID_ETH,
  getEmitterAddressEth,
  getIsTransferCompletedEth,
  redeemOnEth,
  transferFromEth,
  createWrappedOnEth,
  updateWrappedOnEth,
  parseSequenceFromLogEth,
  nativeToHexString,
  attestFromEth,
  WormholeWrappedInfo,
  getOriginalAssetEth,
  hexToUint8Array,
  getForeignAssetEth,
  approveEth,
  CHAIN_ID_SOLANA,
  getOriginalAssetSol,
  getForeignAssetSolana,
  attestFromSolana,
  parseSequenceFromLogSolana,
  transferFromSolana,
  redeemOnSolana,
  createWrappedOnSolana,
} from "@certusone/wormhole-sdk";
import { SOLANA_HOST, SOL_BRIDGE_ADDRESS, SOL_TOKEN_BRIDGE_ADDRESS } from "./consts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  TokenAccountsFilter,
  Transaction,
} from "@solana/web3.js";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
  SolanaSigner
} from "./wormhole";

function isSolSigner(object: any): object is SolanaSigner {
  return "keypair" in object
}

export class Solana implements WormholeChain {
  coreId: string = SOL_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = SOL_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_SOLANA;

  connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_HOST, "confirmed");
  }

  async lookupOriginal(asset: string): Promise<WormholeWrappedInfo> {
    return await getOriginalAssetSol(
      this.connection,
      this.tokenBridgeAddress,
      asset
    );
  }

  async lookupMirrored(
    asset: string | bigint,
    chain: WormholeChain
  ): Promise<WormholeAsset> {
    let assetBytes: Uint8Array;

    if (typeof asset === "bigint") {
      assetBytes = hexToUint8Array(chain.getAssetAsString(asset))
    } else {
      assetBytes = hexToUint8Array(asset);
    }

    const fa = await getForeignAssetSolana(
      this.connection,
      this.tokenBridgeAddress,
      chain.id,
      assetBytes
    );

    if (fa === null) throw new Error("Couldnt find that asset")

    return { chain: this, contract: fa } as WormholeAsset
  }

  emitterAddress(): string {
    return getEmitterAddressEth(this.coreId);
  }



  async attest(attestation: WormholeAttestation): Promise<string> {
    if(!isSolSigner(attestation.sender)) 
      throw new Error("Expected solana signer")

    if (typeof attestation.origin.contract !== "string")
      throw new Error("Expected string contract, got bigint")


    const transaction = await attestFromSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      attestation.sender.getAddress(),
      attestation.origin.contract,
    );

    const txid = await this.connection.sendRawTransaction(
      await attestation.sender.signTxn(transaction)
    );

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);

    if(info === null)throw new Error("Couldnt get info for transaction: "+txid)

    return parseSequenceFromLogSolana(info);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if(!isSolSigner(msg.sender)) 
      throw new Error("Expected solana signer")

    if (typeof msg.origin.contract !== "string")
      throw new Error("Expected string for contract");

    const hexStr = nativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    const transaction = await transferFromSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      msg.sender.getAddress(),
      msg.sender.getAddress(), // from addr?
      msg.origin.contract,
      msg.amount,
      new Uint8Array(Buffer.from(hexStr, "hex")),
      msg.destination.chain.id
    );

    const txid = await this.connection.sendRawTransaction(
      await msg.sender.signTxn(transaction)
    );

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);
    if(info === null) throw new Error("Couldnt get infor for transaction: "+txid)

    return parseSequenceFromLogSolana(info);
  }

  async redeem(
    signer: SolanaSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const transaction = await redeemOnSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      signer.getAddress(),
      receipt.VAA
    );

    const txid = await this.connection.sendRawTransaction(
      await signer.signTxn(transaction)
    );

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);
    if (info === null) throw new Error("Couldnt get transaction: "+txid)
    return {  } as WormholeAsset;
  }

  async createWrapped(
    signer: SolanaSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const transaction = await createWrappedOnSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      signer.getAddress(),
      receipt.VAA
    );
    return {} as WormholeAsset
    //return { chain: this, contract: contractAddress };
  }
  async updateWrapped(
    signer: SolanaSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    return {} as WormholeAsset
    //const { contractAddress } = await updateWrappedOnEth(
    //  this.tokenBridgeAddress,
    //  signer,
    //  receipt.VAA
    //);
    //return { chain: this, contract: contractAddress };
  }

  transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getAssetAsString(asset: bigint): string {
    throw new Error("Method not implemented.");
  }
  getAssetAsInt(asset: string): bigint {
    throw new Error("Method not implemented.");
  }
}
