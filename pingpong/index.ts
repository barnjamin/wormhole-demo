process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeContractTransfer,
} from "../src/wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "../src/wormhole/consts";
import { initChain, ChainConfigs } from "../src/wormhole/helpers";
import algosdk from "algosdk";
import { _parseVAAAlgorand } from "@certusone/wormhole-sdk/lib/cjs/algorand";


(async function () {

    const origin = "algorand"
    const destination = "algorand"

    const [originChain, originSigner] = initChain(ChainConfigs[origin]);
    const [destChain, destSigner] = initChain(ChainConfigs[destination]);
  
    const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

    const appId = 110207597 
    const appAddr = algosdk.getApplicationAddress(appId)
    const emitter = Buffer.from(algosdk.decodeAddress(appAddr).publicKey).toString('hex')
    console.log(`Emitter address: ${emitter}`)

    const vaa = await wh.getVAA("4", originChain, destChain, emitter)

    const rawVaa = Buffer.from(vaa.VAA).toString('hex')
    console.log(`Raw VAA: ${rawVaa}`)

    const parsed = _parseVAAAlgorand(vaa.VAA)
    console.log(parsed)

})();

