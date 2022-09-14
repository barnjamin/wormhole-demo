process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeActionType,
  WormholeAssetTransfer,
  WormholeContractTransfer,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import { initChain, ChainConfigs } from "./wormhole/helpers";

(async function () {
  await roundTripAsset(BigInt(0), BigInt(100), "algorand", "solana");
  //await roundTripAsset(BigInt(0), BigInt(100), "algorand", "avalanche");
  //await roundTripAsset(BigInt(0), BigInt(100), "algorand", "ethereum");
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