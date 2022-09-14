process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeContractTransfer,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import { initChain, ChainConfigs } from "./wormhole/helpers";


(async function () {
  await contractTransfer(
    BigInt(0), // Asset Id / Contract
    BigInt(100),  // Amount
    BigInt(89737126), // App Id / Contract to call
    "algorand", // From chain
    "algorand", // To chain
    new Uint8Array(Buffer.from("Testing123")) // Payload to pass to the receiving contract 
  );
})();


async function contractTransfer(
    asset: bigint | string,
    amount: bigint,
    contract: bigint | string,
    origin: string,
    destination: string,
    payload: Uint8Array
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
      payload: payload,
    };
  
    console.log(`Sending contract transfer from ${origin} to ${destination}`);
    const seq = await originChain.contractTransfer(cxfer);
  
    console.log(`Getting VAA for Sequence number: ${seq}`)
    const receipt = await wh.getVAA(seq, originChain, destChain)
  
    console.log(`Redeeming contract transfer on ${destination}`);
    await destChain.contractRedeem(destSigner, receipt, destAsset)
  }
  