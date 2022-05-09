import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import {
  getSignedVAAWithRetry,
  ChainId,
  WormholeWrappedInfo,
  getOriginalAssetAlgorand,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { TerraSigner } from "./terra";

export interface AlgorandSigner {
  getAddress(): string;
  signTxn(txn: any): Promise<Uint8Array>;
}

export interface SolanaSigner {
  getAddress(): string;
  signTxn(txn: any): Promise<Buffer>;
}

export type Signer = AlgorandSigner | ethers.Signer | SolanaSigner | TerraSigner;

export type WormholeAsset = {
  chain: WormholeChain;
  contract: string | bigint;
};

export type WormholeReceipt = {
  origin: WormholeChain;
  destination: WormholeChain;

  VAA: Uint8Array;
};

// TODO: Other Message types?
export enum WormholeMessageType {
  Attestation = 1,
  TokenTransfer = 2,
}

export type WormholeTokenTransfer = {
  origin: WormholeAsset;
  sender: Signer;
  destination: WormholeAsset;
  receiver: Signer;
  amount: bigint;
};

export type WormholeAttestation = {
  origin: WormholeAsset;
  sender: Signer;
  destination: WormholeChain;
  receiver: Signer;
};

export type WormholeMessage = {
  type: WormholeMessageType;
  attestation?: WormholeAttestation;
  tokenTransfer?: WormholeTokenTransfer;
};

export interface WormholeChain {
  id: ChainId;

  emitterAddress(): Promise<string>;

  attest(asset: WormholeAttestation): Promise<string>;
  transfer(msg: WormholeTokenTransfer): Promise<string>;

  redeem(
    signer: Signer,
    receipt: WormholeReceipt,
    asset?: WormholeAsset
  ): Promise<WormholeAsset>;
  createWrapped(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset>;
  updateWrapped(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset>;

  // Gets the original contract/asset id and chain for this asset locally
  lookupOriginal(asset: string | bigint): Promise<WormholeWrappedInfo>;
  // Get the local contract/asset id for some original asset
  lookupMirrored(
    asset: string | bigint,
    chain: WormholeChain
  ): Promise<WormholeAsset>;

  transactionComplete(receipt: WormholeReceipt): Promise<boolean>;

  getAssetAsString(asset: bigint | string): string;
  getAssetAsInt(asset: string | bigint): bigint;
}

export class Wormhole {
  rpcHosts: string[];
  constructor(rpc: string[]) {
    this.rpcHosts = rpc;
  }

  async getVAA(
    sequence: string,
    origin: WormholeChain,
    destination: WormholeChain
  ): Promise<WormholeReceipt> {
    console.time("get vaa")
    const { vaaBytes } = await getSignedVAAWithRetry(
      this.rpcHosts,
      origin.id,
      await origin.emitterAddress(),
      sequence,
      { transport: NodeHttpTransport() }
    );

    console.timeEnd("get vaa")
    return {
      VAA: vaaBytes,
      origin: origin,
      destination: destination,
    } as WormholeReceipt;
  }

  async getOrigin(asset: WormholeAsset): Promise<WormholeWrappedInfo> {
    return asset.chain.lookupOriginal(asset.contract);
  }
  async getMirrored(
    asset: WormholeAsset,
    chain: WormholeChain
  ): Promise<WormholeAsset> {
    return await chain.lookupMirrored(asset.contract, asset.chain);
  }

  // mirrors an asset from one chain to another
  // Returns the wormhole asset on the other chain
  async mirror(attestation: WormholeAttestation): Promise<WormholeAsset> {
    // TODO: Check if this is even necessary?
    //const wi = await this.getOrigin(attestation.origin)
    //if(wi.isWrapped) throw new Error("This is a wrapped asset, mirror from the origin chain: " + JSON.stringify(wi))
    //try {
    //  const mirrored = await this.getMirrored(attestation.origin, attestation.destination)
    //  //throw a new error?
    //}catch(e){
    //  // Not found,
    //}

    const origin = attestation.origin.chain;
    const destination = attestation.destination;

    const sequence = await origin.attest(attestation);

    const receipt = await this.getVAA(sequence, origin, destination);


    try {
      return await destination.createWrapped(attestation.receiver, receipt);
    } catch (e) {
      //
    }

    return await destination.updateWrapped(attestation.receiver, receipt);
  }

  // Transfers tokens into WormHole
  // returns signed VAA
  async transfer(transfer: WormholeTokenTransfer): Promise<WormholeReceipt> {
    const origin = transfer.origin.chain;
    const destination = transfer.destination.chain;
    const sequence = await origin.transfer(transfer);
    return await this.getVAA(sequence, origin, destination);
  }

  // TODO: Send is not a great name, since we transmit AND receive,
  // maybe perform?
  async send(msg: WormholeMessage): Promise<WormholeAsset> {
    switch (msg.type) {
      case WormholeMessageType.Attestation:
        if (msg.attestation === undefined)
          throw new Error("Type Attestation but was undefined");
        return this.mirror(msg.attestation);
      case WormholeMessageType.TokenTransfer:
        if (msg.tokenTransfer === undefined)
          throw new Error("Type TokenTransfer but was undefined");
          
        console.time("xfer")
        const receipt = await this.transfer(msg.tokenTransfer)
        console.timeEnd("xfer")

        console.time("claim")
        const asset = await this.claim( msg.tokenTransfer.receiver, receipt, msg.tokenTransfer.destination);
        console.time("claim")

        return asset
    }
    return {} as WormholeAsset;
  }

  // Claims tokens or arbitrary message from wormhole given VAA
  async claim(
    signer: Signer,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    return await receipt.destination.redeem(signer, receipt, asset);
  }
}
