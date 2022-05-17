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
  //await roundTripAsset(BigInt(0), BigInt(100), "algorand", "solana");
  //await roundTripAsset(BigInt(0), BigInt(100), "algorand", "avalanche");
  //await roundTripAsset(BigInt(0), BigInt(100), "algorand", "ethereum");

  await contractTransfer(
    BigInt(0),
    BigInt(100), 
    BigInt(89737126),
    "algorand",
    "algorand"
  );
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

async function contractTransfer(
  asset: bigint | string,
  amount: bigint,
  contract: bigint | string,
  origin: string,
  destination: string
) {
  const [originChain, originSigner] = initChain(ChainConfigs[origin]);
  const [destChain, destSigner] = initChain(ChainConfigs[destination]);

  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // The destination contract address
  const destinationContract = destChain.getAssetAsString(contract);

  const originAsset: WormholeAsset = { chain: originChain, contract: asset };
  const destAsset = await wh.getMirrored(originAsset, destChain)

  const cxfer: WormholeContractTransfer = {
    transfer: {
      origin: originAsset,
      sender: originSigner,
      destination: destAsset,
      receiver: destSigner,
      amount: amount,
    },
    contract: destinationContract,
    payload: new Uint8Array(Buffer.from("Testing123")),
  };

  console.log(`Sending contract transfer from ${origin} to ${destination}`);
  const seq = await originChain.contractTransfer(cxfer);

  console.log(`Getting VAA for Sequence number: ${seq}`)
  const receipt = await wh.getVAA(seq, originChain, destChain)

  console.log(`Redeeming contract transfer on ${destination}`);
  await destChain.contractRedeem(destSigner, receipt, destAsset)
}
