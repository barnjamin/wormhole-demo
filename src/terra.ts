import {
  ChainId,
  tryNativeToHexString,
  WormholeWrappedInfo,
  hexToUint8Array,
  CHAIN_ID_TERRA,
  getOriginalAssetTerra,
  getForeignAssetTerra,
  getEmitterAddressTerra,
  attestFromTerra,
  parseSequenceFromLogTerra,
  transferFromTerra,
  redeemOnTerra,
  createWrappedOnTerra,
  updateWrappedOnTerra,
  getIsTransferCompletedTerra,
} from "@certusone/wormhole-sdk";
import { TERRA_BRIDGE_ADDRESS, TERRA_TOKEN_BRIDGE_ADDRESS } from "./consts";
import {
  WormholeAsset,
  WormholeAttestation,
  WormholeChain,
  WormholeReceipt,
  WormholeTokenTransfer,
} from "./wormhole";
import {
  LCDClient,
  Key,
  MsgExecuteContract,
  TxInfo,
  Wallet,
} from "@terra-money/terra.js";

export class TerraSigner {
  terraWallet: Wallet;

  constructor(key: Key, client: LCDClient) {
    this.terraWallet = client.wallet(key);
  }

  async getAddress(): Promise<string> {
    return this.terraWallet.key.accAddress;
  }
}

function isTerraSigner(object: any): object is TerraSigner {
  return "terraWallet" in object;
}

export class Terra implements WormholeChain {
  coreId: string = TERRA_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = TERRA_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_TERRA;

  client: any;

  constructor(client: LCDClient) {
    this.client = client;
  }
  async lookupOriginal(asset: string): Promise<WormholeWrappedInfo> {
    return await getOriginalAssetTerra(this.client, asset);
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

    const fa = await getForeignAssetTerra(
      this.tokenBridgeAddress,
      this.client,
      chain.id,
      assetBytes
    );

    return { chain: this, contract: fa } as WormholeAsset;
  }

  async emitterAddress(): Promise<string> {
    return getEmitterAddressTerra(this.tokenBridgeAddress);
  }

  async attest(attestation: WormholeAttestation): Promise<string> {
    if (typeof attestation.origin.contract === "bigint")
      throw new Error("Expected string contract, got bigint");

    if (!isTerraSigner(attestation.sender))
      throw new Error("Expected ethers.Signer");

    const txns = await attestFromTerra(
      this.tokenBridgeAddress,
      await attestation.sender.getAddress(),
      attestation.origin.contract
    );

    const info = await this.signSendWait([txns], attestation.sender);

    return parseSequenceFromLogTerra(info);
  }

  async transfer(msg: WormholeTokenTransfer): Promise<string> {
    if (!isTerraSigner(msg.sender)) throw new Error("Expected TerraSigner");

    if (typeof msg.origin.contract !== "string")
      throw new Error("Expected string for contract");

    const hexStr = tryNativeToHexString(
      await msg.receiver.getAddress(),
      msg.destination.chain.id
    );

    if (hexStr === null) throw new Error("Couldnt parse address for receiver");

    const txns = await transferFromTerra(
      await msg.sender.getAddress(),
      this.tokenBridgeAddress,
      msg.origin.contract,
      msg.amount.toString(),
      msg.destination.chain.id,
      new Uint8Array(Buffer.from(hexStr, "hex"))
    );

    const info = await this.signSendWait(txns, msg.sender);

    return parseSequenceFromLogTerra(info);
  }

  async redeem(
    signer: TerraSigner,
    receipt: WormholeReceipt,
    asset: WormholeAsset
  ): Promise<WormholeAsset> {
    const txns = await redeemOnTerra(
      this.tokenBridgeAddress,
      await signer.getAddress(),
      receipt.VAA
    );

    const info = await this.signSendWait([txns], signer);

    return asset;
  }

  getContractAddressFromTxInfo(info: TxInfo): string {
    if (info.logs === undefined) return "";
    if (info.logs.length === 0) return "";
    return info.logs[0].eventsByType.from_contract.contract[0];
  }

  async createWrapped(
    signer: TerraSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const txns = await createWrappedOnTerra(
      this.tokenBridgeAddress,
      await signer.getAddress(),
      receipt.VAA
    );

    const info = await this.signSendWait([txns], signer);

    //const contract_address = this.getContractAddressFromTxInfo(info)
    return { chain: this, contract: "todo" };
  }

  async updateWrapped(
    signer: TerraSigner,
    receipt: WormholeReceipt
  ): Promise<WormholeAsset> {
    const txns = await updateWrappedOnTerra(
      this.tokenBridgeAddress,
      await signer.getAddress(),
      receipt.VAA
    );
    const info = await this.signSendWait([txns], signer);

    return { chain: this, contract: (info.codespace ||= "") };
  }

  async transactionComplete(receipt: WormholeReceipt): Promise<boolean> {
    return await getIsTransferCompletedTerra(
      this.tokenBridgeAddress,
      receipt.VAA,
      this.client,
      this.client.config.gasPrices
    );
  }

  getAssetAsString(asset: string | bigint): string {
    throw new Error("Method not implemented.");
  }
  getAssetAsInt(asset: string | bigint): bigint {
    throw new Error("Method not implemented.");
  }

  async signSendWait(
    txns: MsgExecuteContract[],
    signer: TerraSigner
  ): Promise<TxInfo> {
    const gasPrices = this.client.config.gasPrices;
    const FeeAsset: string = "uluna";

    const feeEstimate = await this.client.tx.estimateFee(
      [
        {
          sequenceNumber: await signer.terraWallet.sequence(),
          publicKey: signer.terraWallet.key.publicKey,
        },
      ],
      {
        msgs: txns,
        feeDenoms: [FeeAsset],
        gasPrices,
      }
    );

    const executeTx = await signer.terraWallet.createAndSignTx({
      msgs: txns,
      feeDenoms: [FeeAsset],
      gasPrices,
      fee: feeEstimate,
    });

    const result = await this.client.tx.broadcast(executeTx);
    if (result.code !== 0)
      throw new Error("Failed to broadcast transaction: " + result.raw_log);

    const info = await this.waitForTerraExecution(result.txhash);

    if (!info) throw new Error("info not found");
    return info;
  }

  async waitForTerraExecution(txhash: any) {
    let done: boolean = false;
    let info;
    while (!done) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        info = await this.client.tx.txInfo(txhash);
        if (info) {
          done = true;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (info && info.code !== 0) {
      // error code
      throw new Error(`Tx ${txhash}: error code ${info.code}: ${info.raw_log}`);
    }
    return info;
  }
}
