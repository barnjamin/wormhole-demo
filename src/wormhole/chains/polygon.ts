import axios from "axios";
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

  overrides: ethers.Overrides = {  };

  async updateOverrides(signer: ethers.Signer): Promise<ethers.Overrides> {
    console.log("updating overrides")


    const nonce = await signer.getTransactionCount()

    // get max fees from gas station
    let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
    let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
    try {
      const { data } = await axios({
        method: "get",
        url: "https://gasstation-mumbai.matic.today/v2",
      });

      maxFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxFee) + "",
        "gwei"
      );
      maxPriorityFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxPriorityFee) + "",
        "gwei"
      );
    } catch { /* ignore*/ }

    return { gasLimit: 10_000_000, maxFeePerGas, maxPriorityFeePerGas, nonce } as ethers.Overrides;
  }
}
