import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import { getSignedVAAWithRetry, ChainId } from "@certusone/wormhole-sdk";
import { WORMHOLE_RPC_HOSTS } from "./consts";
import { ethers } from "ethers";

export interface AlgorandSigner {
  getAddress(): string;
  signTxn(txn: any): Promise<Uint8Array>;
}

export type Signer = AlgorandSigner | ethers.Signer;

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

  redeem(signer: Signer, receipt: WormholeReceipt): Promise<boolean>;
  createWrapped(signer: Signer, receipt: WormholeReceipt): Promise<WormholeAsset>;
  updateWrapped(signer: Signer, receipt: WormholeReceipt): Promise<WormholeAsset>;

  transactionComplete(receipt: WormholeReceipt): Promise<boolean>;
}

export class Wormhole {
  constructor() {
    // Config? RPC addr?
    // List of acceptable chains?
  }

  async getVAA(
    sequence: string,
    chain: WormholeChain
  ): Promise<WormholeReceipt> {

    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      chain.id,
      chain.emitterAddress(),
      sequence,
      { transport: NodeHttpTransport() }
    );

    return { VAA: vaaBytes, origin: chain } as WormholeReceipt;
  }

  // mirrors an asset from one chain to another
  // Returns the wormhole asset on the other chain
  async mirror(
    originSigner: Signer,
    asset: WormholeAsset,
    destSigner: Signer,
    dest: WormholeChain
  ): Promise<WormholeAsset> {
    // TODO: Check if necessary?

    const sequence = await asset.chain.attest({
      origin: asset, 
      sender: originSigner,
      destination: dest,
      receiver: destSigner,
    });

    const receipt = await this.getVAA(sequence, asset.chain);

    try {
      await dest.createWrapped(destSigner, receipt)
    }catch(e){
      //
    }

    try {
      await dest.updateWrapped(destSigner, receipt)
    }catch(e){
      //
    }

    return {} as WormholeAsset;
  }

  // transmit Transfers tokens or arbitrary message into WormHole
  // Accepts Signer interface and a WormholeMessage
  // returns signed VAA
  async transmit(
    msg: WormholeMessage
  ): Promise<WormholeReceipt> {

    if (msg.type !== WormholeMessageType.TokenTransfer || msg.tokenTransfer === undefined) throw new Error("Expected token transfer message");

    const origin = msg.tokenTransfer.origin.chain

    const sequence = await origin.transfer(msg.tokenTransfer);

    return await this.getVAA(sequence, origin)
  }

  // Claims tokens or arbitrary message from wormhole given VAA
  // Return TxId (?) from claim
  async receive(signer: Signer, receipt: WormholeReceipt): Promise<string> {
    const thing = await receipt.destination.redeem(signer, receipt);
    return "";
  }
}
