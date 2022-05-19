process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeActionType,
  WormholeAssetTransfer,
  WormholeChain,
  WormholeContractTransfer,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import { initChain, ChainConfigs } from "./wormhole/helpers";

(async function () {
    const seq = "123"
    await pythTransfer(seq);
})();

async function pythTransfer(seq: string) {

    // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
    const wh = new Wormhole(WORMHOLE_RPC_HOSTS);
    const [originChain, originSigner] = initChain(ChainConfigs["solana"]);
    const [destChain, destSigner] = initChain(ChainConfigs["algorand"]);


    const receipt = await wh.getVAA(seq, originChain, destChain);

    

    
    console.log(receipt)
}