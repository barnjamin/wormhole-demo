process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
} from "../src/wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "../src/wormhole/consts";
import { initChain, ChainConfigs } from "../src/wormhole/helpers";
import algosdk from "algosdk";
import { _parseVAAAlgorand } from "@certusone/wormhole-sdk/lib/cjs/algorand";

import { PingPong } from "./src/pingpong_client";
import { AlgorandSigner } from "../src/wormhole/chains/algorand";

const origin = "algorand";
const destination = "algorand";

const appId = 110747775;
const appAddr = algosdk.getApplicationAddress(appId);
const emitter = Buffer.from(algosdk.decodeAddress(appAddr).publicKey).toString(
  "hex"
);

(async function () {
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Reuse since its the same origin/dest
  const chainConfig = ChainConfigs[origin];
  const [algoChain, algoSigner] = initChain(chainConfig);

  let seq = (1).toString()

  // const signer =  algoSigner as AlgorandSigner;
  // const appClient = new PingPong({
  //   appId: appId,
  //   client: chainConfig.getClient(),
  //   sender: signer.account.addr,
  //   signer: algosdk.makeBasicAccountTransactionSigner(signer.account),
  // });

  // const kickstartResult = await appClient.kickstart({});
  // if (kickstartResult.txInfo === undefined)
  //   throw Error("No txinfo returned from kickstart");

  // const rawSeq = kickstartResult.txInfo["inner-txns"][0]["logs"][0];
  // let seq = algosdk.decodeUint64(
  //   new Uint8Array(Buffer.from(rawSeq, "base64")),
  //   "mixed"
  // ).toString();

  for (let x = 0; x<10; x++){
    console.log(`Getting VAA for Sequence number: ${seq}`);
    const receipt = await wh.getVAA(seq, algoChain, algoChain, emitter);

    console.log(`Redeeming contract transfer on ${destination}`);
    seq = await algoChain.contractRedeem(algoSigner, receipt);
  }


})();