import {
  ChainId,
  WormholeWrappedInfo,
  getIsTransferCompletedSolana,
  hexToUint8Array,
  CHAIN_ID_SOLANA,
  getOriginalAssetSol,
  getForeignAssetSolana,
  attestFromSolana,
  parseSequenceFromLogSolana,
  transferFromSolana,
  redeemOnSolana,
  createWrappedOnSolana,
  setDefaultWasm,
  postVaaSolana,
  getEmitterAddressSolana,
  tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import { SOL_BRIDGE_ADDRESS, SOL_TOKEN_BRIDGE_ADDRESS } from "./consts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";

import bs58 from "bs58";

setDefaultWasm("node");

export class SolanaSigner {
  keypair: Keypair;
  constructor(key: string) {
    this.keypair = Keypair.fromSecretKey(bs58.decode(key));
  }

  getAddress() {
    return this.keypair.publicKey.toBase58();
  }

  async getTokenAddress(token: string): Promise<PublicKey> {
    return Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(token),
      this.keypair.publicKey
    );
  }

  async signTxn(txn: Transaction): Promise<Buffer> {
    txn.partialSign(this.keypair);
    return txn.serialize();
  }
}

export function isSolSigner(object: any): object is SolanaSigner {
  return "keypair" in object;
}

export class Solana implements WormholeChain {
  coreId: string = SOL_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = SOL_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_SOLANA;

  connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
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
      assetBytes = hexToUint8Array(chain.getAssetAsString(asset));
    } else {
      assetBytes = hexToUint8Array(asset);
    }

    const fa = await getForeignAssetSolana(
      this.connection,
      this.tokenBridgeAddress,
      chain.id,
      assetBytes
    );

    if (fa === null) throw new Error("Couldnt find that asset");

    return { chain: this, contract: fa } as WormholeAsset;
  }

  async emitterAddress(): Promise<string> {
    return await getEmitterAddressSolana(this.tokenBridgeAddress);
  }

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (!isSolSigner(attestation.sender))
      throw new Error("Expected solana signer");

    if (typeof attestation.origin.contract !== "string")
      throw new Error("Expected string contract, got bigint");

    const transaction = await attestFromSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      attestation.sender.getAddress(),
      attestation.origin.contract
    );

    const txid = await this.connection.sendRawTransaction(
      await attestation.sender.signTxn(transaction)
    );

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);

    if (info === null)
      throw new Error("Couldnt get info for transaction: " + txid);

    return parseSequenceFromLogSolana(info);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if (!isSolSigner(msg.sender)) throw new Error("Expected solana signer");
    if (typeof msg.origin.contract !== "string")
      throw new Error("Expected string for contract");

    const hexStr = tryNativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    const original = await this.lookupOriginal(msg.origin.contract);
    let originAddress: Uint8Array | undefined = undefined;
    let originChain: ChainId | undefined = undefined;
    if (original.isWrapped) {
      originAddress = original.assetAddress;
      originChain = original.chainId;
    }

    const fromAddr = await msg.sender.getTokenAddress(msg.origin.contract);
    const transaction = await transferFromSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      msg.sender.getAddress(),
      fromAddr.toString(),
      msg.origin.contract,
      msg.amount,
      hexToUint8Array(hexStr),
      msg.destination.chain.id,
      originAddress,
      originChain
    );

    const txid = await this.connection.sendRawTransaction(
      await msg.sender.signTxn(transaction)
    );

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);
    if (info === null)
      throw new Error("Couldnt get infor for transaction: " + txid);

    return parseSequenceFromLogSolana(info);
  }

  async redeem(
    signer: SolanaSigner,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    if (typeof asset.contract !== "string")
      throw new Error("Expected string contract");

    await this.createTokenAddress(signer, asset.contract);

    // post vaa to Solana
    await postVaaSolana(
      this.connection,
      async (transaction) => {
        transaction.partialSign(signer.keypair);
        return transaction;
      },
      this.coreId,
      signer.getAddress(),
      Buffer.from(receipt.VAA)
    );

    const transaction = await redeemOnSolana(
      this.connection,
      this.coreId,
      this.tokenBridgeAddress,
      signer.getAddress(),
      receipt.VAA
    );
    const signed = await signer.signTxn(transaction);
    const txid = await this.connection.sendRawTransaction(signed);

    await this.connection.confirmTransaction(txid);
    const info = await this.connection.getTransaction(txid);
    if (info === null) throw new Error("Couldnt get transaction: " + txid);
    return asset;
  }

  async createTokenAddress(signer: SolanaSigner, token: string) {
    const recipient = await signer.getTokenAddress(token);

    // create the associated token account if it doesn't exist
    const associatedAddressInfo = await this.connection.getAccountInfo(
      recipient
    );
    if (!associatedAddressInfo) {
      const transaction = new Transaction().add(
        await Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          new PublicKey(token),
          recipient,
          signer.keypair.publicKey, // owner
          signer.keypair.publicKey // payer
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signer.keypair.publicKey;
      // sign, send, and confirm transaction
      const txid = await this.connection.sendRawTransaction(
        await signer.signTxn(transaction)
      );
      await this.connection.confirmTransaction(txid);
    }
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
    return {} as WormholeAsset;
    //return { chain: this, contract: contractAddress };
  }
  async updateWrapped(
    signer: SolanaSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    return {} as WormholeAsset;
    //const { contractAddress } = await updateWrappedOnEth(
    //  this.tokenBridgeAddress,
    //  signer,
    //  receipt.VAA
    //);
    //return { chain: this, contract: contractAddress };
  }

  transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    return getIsTransferCompletedSolana(
      this.tokenBridgeAddress,
      receipt.VAA,
      this.connection
    );
  }

  getAssetAsString(asset: bigint): string {
    throw new Error("Method not implemented.");
  }
  getAssetAsInt(asset: string): bigint {
    throw new Error("Method not implemented.");
  }
}
