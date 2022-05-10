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
  CHAIN_ID_ETHEREUM_ROPSTEN,
  approveEth,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import {
  ROPSTEN_ETH_BRIDGE_ADDRESS,
  ROPSTEN_ETH_TOKEN_BRIDGE_ADDRESS,
} from "../consts";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "../wormhole";

export type EthereumSigner = ethers.Signer;

export class Ethereum implements WormholeChain {
  coreId: string = ROPSTEN_ETH_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = ROPSTEN_ETH_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_ETHEREUM_ROPSTEN;

  provider: any;

  constructor(provider: any) {
    this.provider = provider;
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

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (typeof attestation.origin.contract === "bigint")
      throw new Error("Expected string contract, got bigint");

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

    const hexStr = tryNativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    await approveEth(
      this.tokenBridgeAddress,
      msg.origin.contract,
      msg.sender,
      msg.amount
    );

    const receipt = await transferFromEth(
      this.tokenBridgeAddress,
      msg.sender,
      msg.origin.contract,
      msg.amount,
      msg.destination.chain.id,
      new Uint8Array(Buffer.from(hexStr, "hex"))
    );

    return parseSequenceFromLogEth(receipt, this.coreId);
  }

  async redeem(
    signer: ethers.Signer,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    const { contractAddress } = await redeemOnEth(
      this.tokenBridgeAddress,
      signer,
      receipt.VAA
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

  getAssetAsString(asset: bigint | string): string {
    throw new Error("Method not implemented.");
  }
  getAssetAsInt(asset: string): bigint {
    throw new Error("Method not implemented.");
  }
}
