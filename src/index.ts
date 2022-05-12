process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Signer,
  Wormhole,
  WormholeChain,
  WormholeAsset,
  WormholeAction,
  WormholeActionType,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import {initChain, ChainConfigs} from "./wormhole/helpers"

(async function () {
  await roundTripAlgoSol()
})();

async function roundTripAlgoSol(){
  const [algo, algoSigner] = initChain(ChainConfigs["algorand"]);
  const [sol, solSigner] = initChain(ChainConfigs["solana"]);

  // Asset we want to transfer from the origin chain 
  const asset = BigInt(0)

  await roundTripAsset(asset, algo, sol, algoSigner, solSigner);
}

async function roundTripAsset(
  asset: string | bigint,
  originChain: WormholeChain,
  destChain: WormholeChain,
  originSigner: Signer,
  destSigner: Signer
) {
  
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Just get the string names for logs later
  const originName = originChain.constructor.name;
  const destName = destChain.constructor.name;

  // Get the destination asset
  const originAsset: WormholeAsset = {chain: originChain, contract: asset}
  const destAsset = await wh.getMirrored(originAsset, destChain);

  // Prepare the transfer
  const xfer: WormholeAction = {
    action: WormholeActionType.AssetTransfer,
    assetTransfer: {
      origin: originAsset,
      sender: originSigner,
      destination: destAsset,
      receiver: destSigner,
      amount: BigInt(100),
    },
  };

  console.log(`Sending transfer from ${originName} to ${destName}`);

  // Send it
  console.time("xfer");
  await wh.perform(xfer);
  console.timeEnd("xfer");

  // Prepare the opposite transfer
  const xferBack: WormholeAction = {
    action: WormholeActionType.AssetTransfer,
    assetTransfer: {
      origin: destAsset,
      sender: destSigner,
      destination: originAsset,
      receiver: originSigner,
      amount: BigInt(100),
    },
  };

  console.log(`Sending transfer from ${destName} to ${originName}`);

  // Send it
  console.time("xferBack");
  await wh.perform(xferBack);
  console.timeEnd("xferBack");
}

//async function algorand_contract_transfer() {
//  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);
//
//  const algo = new Algorand(getAlgoConnection());
//  const algoSgn = getAlgoSigner();
//
//  // Asset we want to transfer (both sides)
//  const algoAsset: WormholeAsset = {
//    chain: algo,
//    contract: BigInt(0),
//  };
//
//  // App that should be called
//  const receiverApp = BigInt(123);
//  const dest = algo.getAssetAsString(receiverApp);
//
//  const cxfer: WormholeContractTransfer = {
//    transfer: {
//      origin: algoAsset,
//      sender: algoSgn,
//      destination: algoAsset,
//      receiver: algoSgn,
//      amount: BigInt(100),
//    },
//    contract: dest,
//    payload: new Uint8Array(),
//  };
//
//  await algo.contractTransfer(cxfer);
//}
