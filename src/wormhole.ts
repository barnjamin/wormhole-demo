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

  redeem(signer: Signer, receipt: WormholeReceipt): Promise<WormholeAsset>;
  createWrapped(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset>;
  updateWrapped(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset>;

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
  async mirror(attestation: WormholeAttestation): Promise<WormholeAsset> {
    // TODO: Check if this is even necessary?

    const origin = attestation.origin.chain;
    const destination = attestation.destination;

    const sequence = await origin.attest(attestation);

    const receipt = await this.getVAA(sequence, origin);

    try {
      return await destination.createWrapped(attestation.receiver, receipt);
    } catch (e) {
      //
    }

    return await destination.updateWrapped(attestation.receiver, receipt);
  }

  // transmit Transfers tokens or arbitrary message into WormHole
  // Accepts Signer interface and a WormholeMessage
  // returns signed VAA
  async transmit(transfer: WormholeTokenTransfer): Promise<WormholeReceipt> {
    const origin = transfer.origin.chain;

    const sequence = await origin.transfer(transfer);
    return await this.getVAA(sequence, origin);
  }

  async send(msg: WormholeMessage): Promise<WormholeAsset> {
    switch (msg.type) {
      case WormholeMessageType.Attestation:
        if (msg.attestation === undefined)
          throw new Error("Type Attestation but was undefined");
        return this.mirror(msg.attestation);
      case WormholeMessageType.TokenTransfer:
        if (msg.tokenTransfer === undefined)
          throw new Error("Type TokenTransfer but was undefined");
        const receipt = await this.transmit(msg.tokenTransfer);
        return this.receive(msg.tokenTransfer.receiver, receipt);
    }
    return {} as WormholeAsset;
  }

  // Claims tokens or arbitrary message from wormhole given VAA
  async receive(
    signer: Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    return await receipt.destination.redeem(signer, receipt);
  }
}
