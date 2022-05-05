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
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { ETH_BRIDGE_ADDRESS, ETH_TOKEN_BRIDGE_ADDRESS } from "./consts";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";

export class Ethereum implements WormholeChain {
  coreId: string = ETH_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = ETH_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_ETH;

  provider: any;

  constructor(network?: string) {
    this.provider = ethers.getDefaultProvider((network ||= "ropsten"));
  }
  async getOrigin(asset: string): Promise<WormholeWrappedInfo> {
    return await getOriginalAssetEth(
      this.tokenBridgeAddress,
      this.provider,
      asset,
      this.id
    );
  }

  async getWrapped(
    asset: string | bigint,
    chain: WormholeChain
  ): Promise<string | bigint | null> {
    let assetBytes: Uint8Array;

    if (typeof asset === "bigint") {
      const a = parseInt(asset.toString());
      const originAssetHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" +
        a.toString(16)
      ).slice(-64);
      console.log(originAssetHex);
      assetBytes = hexToUint8Array(originAssetHex);
    } else {
      assetBytes = hexToUint8Array(asset);
    }

    return getForeignAssetEth(
      this.tokenBridgeAddress,
      this.provider,
      chain.id,
      assetBytes
    );
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
