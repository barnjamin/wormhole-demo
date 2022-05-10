process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeAssetTransfer,
} from "./wormhole/wormhole";
import { WORMHOLE_RPC_HOSTS } from "./wormhole/consts";
import { Ethereum } from "./wormhole/chains/ethereum";
import { Algorand } from "./wormhole/chains/algorand";
import { Solana } from "./wormhole/chains/solana";
import { Terra } from "./wormhole/chains/terra";
import { Avalanche } from "./wormhole/chains/avalanche";

import {
  getAlgoConnection,
  getAvaxConnection,
  getEthConnection,
  getSolConnection,
  getTerraConnection,
} from "./wormhole/connections";
import {
  getAlgoSigner,
  getAvaxSigner,
  getEthSigner,
  getSolSigner,
  getTerraSigner,
} from "./wormhole/signers";


(async function () {
  await round_trip_solana()
  //await round_trip_terra();
  //await round_trip_ethereum();
  //await round_trip_avalanche()
})();


async function round_trip_ethereum() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand(getAlgoConnection());
  const eth = new Ethereum(getEthConnection());

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const eth_sgn = getEthSigner(eth.provider);

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };
  const eth_asset = await wh.getMirrored(algo_asset, eth);

  const xferAlgoOut: WormholeAssetTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: eth_asset,
    receiver: eth_sgn,
    amount: BigInt(100),
  };

  const xferAlgoIn: WormholeAssetTransfer = {
    destination: algo_asset,
    receiver: algo_sgn,
    origin: eth_asset,
    sender: eth_sgn,
    amount: BigInt(100),
  };

  console.time("Transfer Algo on Algo");
  const receipt_a_s = await wh.transfer(xferAlgoOut);
  console.timeEnd("Transfer Algo on Algo");

  console.time("Claim Algo on Eth");
  await wh.claim(eth_sgn, receipt_a_s, eth_asset);
  console.timeEnd("Claim Algo on Eth");

  console.time("Transfer Algo on Eth");
  const receipt_s_a = await wh.transfer(xferAlgoIn);
  console.timeEnd("Transfer Algo on Eth");

  console.time("Claim Algo on Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo on Algo");
}

async function round_trip_solana() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);
  

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand(getAlgoConnection());
  const sol = new Solana(getSolConnection());

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const sol_sgn = getSolSigner();

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };
  const sol_asset = await wh.getMirrored(algo_asset, sol);

  const xferAlgoSol: WormholeAssetTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: sol_asset,
    receiver: sol_sgn,
    amount: BigInt(100),
  };

  console.time("Transfer Algo on Algo");
  const receipt_a_s = await wh.transfer(xferAlgoSol);
  console.timeEnd("Transfer Algo on Algo");

  console.time("Claim Algo on Sol");
  await wh.claim(sol_sgn, receipt_a_s, sol_asset);
  console.timeEnd("Claim Algo on Sol");

  const xferSolAlgo: WormholeAssetTransfer = {
    destination: algo_asset,
    receiver: algo_sgn,
    origin: sol_asset,
    sender: sol_sgn,
    amount: BigInt(99),
  };

  console.time("Transfer Algo on Sol");
  const receipt_s_a = await wh.transfer(xferSolAlgo);
  console.timeEnd("Transfer Algo on Sol");

  console.time("Claim Algo on Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo on Algo");
}

async function round_trip_terra() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand(getAlgoConnection());
  const terra = new Terra(getTerraConnection());

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const terra_sgn = getTerraSigner(terra.client);

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };

  const terra_asset = await wh.getMirrored(algo_asset, terra);

  const xferAlgoOut: WormholeAssetTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: terra_asset,
    receiver: terra_sgn,
    amount: BigInt(1000),
  };

  const xferAlgoIn: WormholeAssetTransfer = {
    destination: algo_asset,
    receiver: algo_sgn,
    origin: terra_asset,
    sender: terra_sgn,
    amount: BigInt(100),
  };

  console.time("Transfer Algo on Algo");
  const receipt_a_s = await wh.transfer(xferAlgoOut);
  console.timeEnd("Transfer Algo on Algo");

  console.time("Claim Algo on Terra");
  await wh.claim(terra_sgn, receipt_a_s, terra_asset);
  console.timeEnd("Claim Algo on Terra");

  console.time("Transfer Algo on Terra");
  const receipt_s_a = await wh.transfer(xferAlgoIn);
  console.timeEnd("Transfer Algo on Terra");

  console.time("Claim Algo on Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo on Algo");
}

async function round_trip_avalanche() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand(getAlgoConnection());
  const avax = new Avalanche(getAvaxConnection());

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const avax_sgn = getAvaxSigner(avax.provider);

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };
  const avax_asset = await wh.getMirrored(algo_asset, avax);

  const xferAlgoOut: WormholeAssetTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: avax_asset,
    receiver: avax_sgn,
    amount: BigInt(100),
  };

  const xferAlgoIn: WormholeAssetTransfer = {
    destination: algo_asset,
    receiver: algo_sgn,
    origin: avax_asset,
    sender: avax_sgn,
    amount: BigInt(100),
  };

  console.time("Transfer Algo on Algo");
  const receipt_a_s = await wh.transfer(xferAlgoOut);
  console.timeEnd("Transfer Algo on Algo");

  console.time("Claim Algo on Avax");
  await wh.claim(avax_sgn, receipt_a_s, avax_asset);
  console.timeEnd("Claim Algo on Avax");

  console.time("Transfer Algo on Avax");
  const receipt_s_a = await wh.transfer(xferAlgoIn);
  console.timeEnd("Transfer Algo on Avax");

  console.time("Claim Algo on Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo on Algo");
}
