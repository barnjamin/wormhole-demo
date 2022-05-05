import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import {
  getSignedVAAWithRetry,
  ChainId,
  WormholeWrappedInfo,
  getOriginalAssetAlgorand,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";

export interface AlgorandSigner {
  getAddress(): string;
  signTxn(txn: any): Promise<Uint8Array>;
}

export interface SolanaSigner {
  getAddress(): string;
  signTxn(txn: any): Promise<Buffer>;
}

export type Signer = AlgorandSigner | ethers.Signer | SolanaSigner;

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

  emitterAddress(): string;

  attest(asset: WormholeAttestation): Promise<string>;
  transfer(msg: WormholeTokenTransfer): Promise<string>;

  redeem(signer: Signer, receipt: WormholeReceipt): Promise<WormholeAsset>;
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

  getAssetAsString(asset: bigint): string;
  getAssetAsInt(asset: string): bigint;

}

export class Wormhole {
  rpcHosts: string[];
  constructor(rpc: string[]) {
    this.rpcHosts = rpc;
  }

  async getVAA(
    sequence: string,
    chain: WormholeChain
  ): Promise<WormholeReceipt> {
    const { vaaBytes } = await getSignedVAAWithRetry(
      this.rpcHosts,
      chain.id,
      chain.emitterAddress(),
      sequence,
      { transport: NodeHttpTransport()}
    );

    return { VAA: vaaBytes, origin: chain } as WormholeReceipt;
  }

  async getOrigin(
    asset: WormholeAsset,
  ): Promise<WormholeWrappedInfo> {
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

    const sequence = await destination.attest(attestation);

    const receipt = await this.getVAA(sequence, origin);

    try {
      return await destination.createWrapped(attestation.sender, receipt);
    } catch (e) {
      //
    }

    return await destination.updateWrapped(attestation.sender, receipt);
  }

  // Transfers tokens into WormHole
  // returns signed VAA
  async transfer(transfer: WormholeTokenTransfer): Promise<WormholeReceipt> {
    const origin = transfer.origin.chain;
    const sequence = await origin.transfer(transfer);
    console.log("Transferred with sequence: ", sequence)
    const receipt = await this.getVAA(sequence, origin)
    return {...receipt, destination: transfer.destination.chain} as WormholeReceipt;
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
        const receipt = await this.transfer(msg.tokenTransfer);
        console.log("Got receipt: ", receipt)
        return this.receive(msg.tokenTransfer.receiver, receipt);
    }
    return {} as WormholeAsset;
  }

  // Claims tokens or arbitrary message from wormhole given VAA
  async receive(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    console.log("Redeeming on ", receipt.destination)
    return await receipt.destination.redeem(signer, receipt);
  }


}
