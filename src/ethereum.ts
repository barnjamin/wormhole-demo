import {
  ChainId,
  CHAIN_ID_ETH,
  getEmitterAddressEth,
  getIsTransferCompletedEth,
  redeemOnEth,
  transferFromEth,
  createWrappedOnEth,
  updateWrappedOnEth,
  approveEth,
  parseSequenceFromLogEth,
  nativeToHexString,
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

function getEthProvider(): any {
  const ETH_NODE_URL = "";
  return new ethers.providers.WebSocketProvider(ETH_NODE_URL) as any;
}

function getEthSigner(provider: any) {
  const ETH_PRIVATE_KEY =
    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

const ETH_TOKEN_BRIDGE_ADDRESS = "0x0290FB167208Af455bB137780163b7B7a9a10C16";

export class Ethereum implements WormholeChain {
  coreId: string = ETH_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = ETH_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_ETH;

  emitterAddress(): string {
    return getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS);
  }

  async attest(msg: WormholeAttestation): Promise<string> {
    throw new Error("Method not implemented.");
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
  ): Promise<boolean> {
    const provider = getEthProvider();
    await redeemOnEth(this.tokenBridgeAddress, signer, receipt.VAA);
    return true;
  }

  async createWrapped(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    await createWrappedOnEth(this.tokenBridgeAddress, signer, receipt.VAA);
    return {} as WormholeAsset;
  }
  async updateWrapped(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    await updateWrappedOnEth(this.tokenBridgeAddress, signer, receipt.VAA);
    return {} as WormholeAsset;
  }

  async transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    const provider = getEthProvider();
    return await getIsTransferCompletedEth(
      this.tokenBridgeAddress,
      provider,
      receipt.VAA
    );
  }
}
