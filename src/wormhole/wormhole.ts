import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import {
  getSignedVAAWithRetry,
  ChainId,
  WormholeWrappedInfo,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { TerraSigner } from "./chains/terra";
import { AlgorandSigner } from "./chains/algorand";
import { SolanaSigner } from "./chains/solana";


// Signer is a catchall for 
export type Signer =
  | AlgorandSigner
  | ethers.Signer
  | SolanaSigner
  | TerraSigner;

// WormholeAsset is just a wrapper 
// around some specific chain and asset
export type WormholeAsset = {
  chain: WormholeChain;
  contract: string | bigint;
};

// WormholeReceipt should be used on 
// destination chain to claim an asset or
// finish attesting a new asset 
export type WormholeReceipt = {
  origin: WormholeChain; // The originating chain for an action
  destination: WormholeChain; // The destination chain for an action
  VAA: Uint8Array; // The signed VAA
};

// WormholeMessageType describes the type of messages
// that can be sent to Wormhole
export enum WormholeMessageType {
  Attestation = 1,
  AssetTransfer = 2,
}

// WormholeAssetTransfer describes an intended transfer of an asset
// From origin chain to destination chain 
export type WormholeAssetTransfer = {
  origin: WormholeAsset;
  sender: Signer;
  destination: WormholeAsset;
  receiver: Signer;
  amount: bigint;
};

// WormholeAttestation describes an intended creation of a new 
// asset given the originating asset and destination chain
export type WormholeAttestation = {
  origin: WormholeAsset;
  sender: Signer;
  destination: WormholeChain;
  receiver: Signer;
};

export type WormholeMessage = {
  type: WormholeMessageType;
  attestation?: WormholeAttestation;
  tokenTransfer?: WormholeAssetTransfer;
};

export interface WormholeChain {
  id: ChainId;

  emitterAddress(): Promise<string>;

  attest(asset: WormholeAttestation): Promise<string>;
  transfer(msg: WormholeAssetTransfer): Promise<string>;

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

  // getVAA gets the signed VAA given a sequence number and origin chain
  async getVAA(
    sequence: string,
    origin: WormholeChain,
    destination: WormholeChain
  ): Promise<WormholeReceipt> {
    const { vaaBytes } = await getSignedVAAWithRetry(
      this.rpcHosts,
      origin.id,
      await origin.emitterAddress(),
      sequence,
      { transport: NodeHttpTransport() }
    );

    return {
      VAA: vaaBytes,
      origin: origin,
      destination: destination,
    } as WormholeReceipt;
  }

  // getOrigin finds the originating asset information for a given asset
  async getOrigin(asset: WormholeAsset): Promise<WormholeWrappedInfo> {
    return asset.chain.lookupOriginal(asset.contract);
  }

  // getMirrored returns the asset details for the given original asset
  async getMirrored(
    asset: WormholeAsset,
    chain: WormholeChain
  ): Promise<WormholeAsset> {
    return await chain.lookupMirrored(asset.contract, asset.chain);
  }

  // TODO: Send is not a great name, since we transmit AND receive,
  // maybe perform?
  async send(msg: WormholeMessage): Promise<WormholeAsset> {
    switch (msg.type) {
      case WormholeMessageType.Attestation:
        if (msg.attestation === undefined)
          throw new Error("Type Attestation but was undefined");
        return this.mirror(msg.attestation);
      case WormholeMessageType.AssetTransfer:
        if (msg.tokenTransfer === undefined)
          throw new Error("Type TokenTransfer but was undefined");

        const receipt = await this.transfer(msg.tokenTransfer);
        const asset = await this.claim(
          msg.tokenTransfer.receiver,
          receipt,
          msg.tokenTransfer.destination
        );
        return asset;
      default:
        throw new Error("Unknown Wormhole message type");
    }
  }

  // mirrors an asset from one chain to another
  // Returns the wormhole asset on the other chain
  async mirror(attestation: WormholeAttestation): Promise<WormholeAsset> {
    const wi = await this.getOrigin(attestation.origin);
    if (wi.isWrapped)
      throw new Error(
        "This is a wrapped asset, mirror from the origin chain: " +
          JSON.stringify(wi)
      );

    try {
      const mirrored = await this.getMirrored(
        attestation.origin,
        attestation.destination
      );
      // its already mirrored, just return it
      return mirrored;
    } catch (e) {
      /* todo? */
    }

    const origin = attestation.origin.chain;
    const destination = attestation.destination;

    const sequence = await origin.attest(attestation);
    const receipt = await this.getVAA(sequence, origin, destination);

    try {
      return await destination.createWrapped(attestation.receiver, receipt);
    } catch (e) {
      /* todo? */
    }

    return await destination.updateWrapped(attestation.receiver, receipt);
  }

  // Transfers tokens into WormHole
  // returns signed VAA
  async transfer(transfer: WormholeAssetTransfer): Promise<WormholeReceipt> {
    const origin = transfer.origin.chain;
    const destination = transfer.destination.chain;
    const sequence = await origin.transfer(transfer);
    return await this.getVAA(sequence, origin, destination);
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
