process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeAttestation,
  WormholeMessage,
  WormholeMessageType,
  WormholeTokenTransfer,
} from "./wormhole";
import { WORMHOLE_RPC_HOSTS } from "./consts";
import { Ethereum, EthereumSigner } from "./ethereum";
import { Algorand, AlgorandSigner } from "./algorand";
import { Solana, SolanaSigner } from "./solana";
import algosdk, { mnemonicToSecretKey } from "algosdk";

import { ethers } from "ethers";

// Plz dont steal all my testnet money
function getSolSigner(): SolanaSigner {
  const pk =
    "2v5fKQHaDLuWYBQCzFGvovnRNXPy8jkErWkeSMigs1PdsnQvRC5EMX3CJdULaEaQqaMNagfhsoj8sfQ7Dn2MnjKy";
  return new SolanaSigner(pk);
}

function getEthSigner(provider: any): EthereumSigner {
  const ETH_PRIVATE_KEY =
    "0x3f493e59e81db1be4ebbe18b28ba8fdd066ef44139420ead59f37f5dacb80719";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

function getAlgoSigner(): AlgorandSigner {
  const mn =
    "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgorandSigner(mnemonicToSecretKey(mn));
}

(async function () {
  await round_trip_ethereum();
  //await round_trip_solana()
})();

async function round_trip_ethereum() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const eth = new Ethereum();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const eth_sgn = getEthSigner(eth.provider);

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };
  const eth_asset = await wh.getMirrored(algo_asset, eth);

  const xferAlgoOut: WormholeTokenTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: eth_asset,
    receiver: eth_sgn,
    amount: BigInt(100),
  };

  const xferAlgoIn: WormholeTokenTransfer = {
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

  console.time("Claim Algo in Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo in Algo");
}

async function round_trip_solana() {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const sol = new Solana();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const sol_sgn = getSolSigner();

  // Asset we want to transfer (both sides)
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };
  const sol_asset = await wh.getMirrored(algo_asset, sol);

  const xferAlgoSol: WormholeTokenTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: sol_asset,
    receiver: sol_sgn,
    amount: BigInt(100),
  };

  const xferSolAlgo: WormholeTokenTransfer = {
    destination: algo_asset,
    receiver: algo_sgn,
    origin: sol_asset,
    sender: sol_sgn,
    amount: BigInt(100),
  };

  console.time("Transfer Algo in Algo");
  const receipt_a_s = await wh.transfer(xferAlgoSol);
  console.timeEnd("Transfer Algo in Algo");

  console.time("Claim Algo in Sol");
  await wh.claim(sol_sgn, receipt_a_s, sol_asset);
  console.timeEnd("Claim Algo in Sol");

  console.time("Transfer Algo in Sol");
  const receipt_s_a = await wh.transfer(xferSolAlgo);
  console.timeEnd("Transfer Algo in Sol");

  console.time("Claim Algo in Algo");
  await wh.claim(algo_sgn, receipt_s_a, algo_asset);
  console.timeEnd("Claim Algo in Algo");
}
