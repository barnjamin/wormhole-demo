import { ChainId, CHAIN_ID_POLYGON } from "@certusone/wormhole-sdk";
import { BigNumber, ethers } from "ethers";
import {
  POLYGON_BRIDGE_ADDRESS,
  POLYGON_TOKEN_BRIDGE_ADDRESS,
} from "../consts";
import { Ethereum } from "./ethereum";

export type PolygonSigner = ethers.Signer;

export class Polygon extends Ethereum {
  coreId: string = POLYGON_BRIDGE_ADDRESS;
  tokenBridgeAddress: string = POLYGON_TOKEN_BRIDGE_ADDRESS;
  id: ChainId = CHAIN_ID_POLYGON;

  
  overrides: ethers.Overrides = { gasPrice: BigNumber.from("2600000000")  };
}
