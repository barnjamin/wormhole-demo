import {
  ChainId,
  getEmitterAddressEth,
  getIsTransferCompletedEth,
  redeemOnEth,
  transferFromEth,
  createWrappedOnEth,
  updateWrappedOnEth,
  parseSequenceFromLogEth,
  attestFromEth,
  tryNativeToHexString,
  WormholeWrappedInfo,
  getOriginalAssetEth,
  hexToUint8Array,
  getForeignAssetEth,
  approveEth,
  CHAIN_ID_ETH,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import {
  ETH_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
} from "../consts";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeAssetTransfer,
  WormholeContractTransfer,
  Signer,
} from "../wormhole";

export type EthereumSigner = ethers.Signer;

export class Ethereum implements WormholeChain {
  coreId: string = ETH_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = ETH_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_ETH;

  provider: any;

  constructor(provider: any) {
    this.provider = provider;
  }
  contractRedeem(destSigner: Signer, receipt: WormholeReceipt): Promise<string> {
    throw new Error("Method not implemented.");
  }
  contractTransfer(cxfer: WormholeContractTransfer): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async lookupOriginal(asset: string): Promise<WormholeWrappedInfo> {
    return await getOriginalAssetEth(
      this.tokenBridgeAddress,
      this.provider,
      asset,
      this.id
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

    const fa = await getForeignAssetEth(
      this.tokenBridgeAddress,
      this.provider,
      chain.id,
      assetBytes
    );

    return { chain: this, contract: fa } as WormholeAsset;
  }

  async emitterAddress(): Promise<string> {
    return getEmitterAddressEth(this.tokenBridgeAddress);
  }

  async updateOverrides(signer: ethers.Signer): Promise<ethers.Overrides> {
    return {}
  }

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (typeof attestation.origin.contract === "bigint")
      throw new Error("Expected string contract, got bigint");

    if (!(attestation.sender instanceof ethers.Signer))
      throw new Error("Expected ethers.Signer");

    const receipt = await attestFromEth(
      this.tokenBridgeAddress,
      attestation.sender,
      attestation.origin.contract,
      await this.updateOverrides(attestation.sender),
    );

    return parseSequenceFromLogEth(receipt, this.tokenBridgeAddress);
  }

  async transfer(msg: WormholeAssetTransfer): Promise<string> {
    if (!(msg.sender instanceof ethers.Signer))
      throw new Error("Expected ethers.Signer");

    if (typeof msg.origin.contract !== "string")
      throw new Error("Expected string for contract");

    const hexStr = tryNativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    await approveEth(
      this.tokenBridgeAddress,
      msg.origin.contract,
      msg.sender,
      msg.amount,
      await this.updateOverrides(msg.sender)
    );

    const receipt = await transferFromEth(
      this.tokenBridgeAddress,
      msg.sender,
      msg.origin.contract,
      msg.amount,
      msg.destination.chain.id,
      new Uint8Array(Buffer.from(hexStr, "hex")),
      undefined,
      await this.updateOverrides(msg.sender)
    );

    return parseSequenceFromLogEth(receipt, this.coreId);
  }

  async redeem(
    signer: ethers.Signer,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    await redeemOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA,
      await this.updateOverrides(signer)
    );
    return asset;
  }

  async createWrapped(
    signer: ethers.Signer,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const { contractAddress } = await createWrappedOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA,
      await this.updateOverrides(signer)
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
      receipt.VAA,
      await this.updateOverrides(signer)
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

  getAssetAsString(asset: bigint | string): string {
    throw new Error("Method not implemented.");
  }
  getAssetAsInt(asset: string): bigint {
    throw new Error("Method not implemented.");
  }
}
