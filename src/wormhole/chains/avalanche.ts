import { ChainId, CHAIN_ID_AVAX } from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { AVAX_BRIDGE_ADDRESS, AVAX_TOKEN_BRIDGE_ADDRESS } from "../consts";
import { Ethereum } from "./ethereum";

export type AvalancheSigner = ethers.Signer;

export class Avalanche extends Ethereum {
  coreId: string = AVAX_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = AVAX_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_AVAX;
}
