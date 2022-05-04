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
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { ETH_BRIDGE_ADDRESS } from "./consts";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";

const ETH_TOKEN_BRIDGE_ADDRESS = "0x0290FB167208Af455bB137780163b7B7a9a10C16";

export class Ethereum implements WormholeChain {
  coreId: string = ETH_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = ETH_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_ETH;

  provider: any;

  constructor(nodeUrl?: string) {
    this.provider = new ethers.providers.WebSocketProvider(
      (nodeUrl ||= "")
    ) as any;
  }

  emitterAddress(): string {
    return getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS);
  }

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (typeof attestation.origin.contract !== "string")
      throw new Error("Expected bigint for asset, got string");

    if (!(attestation.sender instanceof ethers.Signer))
      throw new Error("Expected ethers.Signer");

    const receipt = await attestFromEth(
      this.tokenBridgeAddress,
      attestation.sender,
      attestation.origin.contract
    );

    return parseSequenceFromLogEth(receipt, this.tokenBridgeAddress);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if (!(msg.sender instanceof ethers.Signer))
      throw new Error("Expected ethers.Signer");

    if (typeof msg.origin.contract !== "string")
      throw new Error("Expected string for contract");

    const hexStr = nativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    const receipt = await transferFromEth(
      this.tokenBridgeAddress,
      msg.sender,
      msg.origin.contract,
      msg.amount.toString(),
      msg.destination.chain.id,
      new Uint8Array(Buffer.from(hexStr, "hex"))
    );

    return parseSequenceFromLogEth(receipt, this.tokenBridgeAddress);
  }

  async redeem(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const { contractAddress } = await redeemOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA
    );
    return { chain: this, contract: contractAddress } as WormholeAsset;
  }

  async createWrapped(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const { contractAddress } = await createWrappedOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA
    );
    return { chain: this, contract: contractAddress };
  }
  async updateWrapped(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const { contractAddress } = await updateWrappedOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA
    );
    return { chain: this, contract: contractAddress };
  }

  async transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    return await getIsTransferCompletedEth(
      this.tokenBridgeAddress,
      this.provider,
      receipt.VAA
    );
  }
}
