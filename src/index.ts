process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeActionType,
  WormholeAssetTransfer,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import { initChain, ChainConfigs } from "./wormhole/helpers";

(async function () {
  await roundTripAsset(BigInt(0), BigInt(100), "algorand", "solana");
})();

async function roundTripAsset(
  asset: string | bigint,
  amount: bigint,
  origin: string,
  destination: string
) {
  const [originChain, originSigner] = initChain(ChainConfigs[origin]);
  const [destChain, destSigner] = initChain(ChainConfigs[destination]);

  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Get the destination asset
  const originAsset: WormholeAsset = { chain: originChain, contract: asset };
  const destAsset = await wh.getMirrored(originAsset, destChain);

  // Prepare the transfer
  const xfer: WormholeAssetTransfer = {
    origin: originAsset,
    sender: originSigner,
    destination: destAsset,
    receiver: destSigner,
    amount: amount,
  };

  // Send it
  console.log(`Sending transfer from ${origin} to ${destination}`);
  console.time("xfer");
  await wh.perform({
    action: WormholeActionType.AssetTransfer,
    assetTransfer: xfer,
  });
  console.timeEnd("xfer");

  // Prepare the opposite transfer
  const xferBack: WormholeAssetTransfer = {
    origin: xfer.destination,
    sender: xfer.receiver,
    destination: xfer.origin,
    receiver: xfer.sender,
    amount: amount,
  };

  // Send it
  console.log(`Sending transfer from ${destination} to ${origin}`);
  console.time("xferBack");
  await wh.perform({
    action: WormholeActionType.AssetTransfer,
    assetTransfer: xferBack,
  });
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
