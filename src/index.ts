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
  const pk = "2v5fKQHaDLuWYBQCzFGvovnRNXPy8jkErWkeSMigs1PdsnQvRC5EMX3CJdULaEaQqaMNagfhsoj8sfQ7Dn2MnjKy"
  return new SolanaSigner(pk);
}

function getEthSigner(provider: any): EthereumSigner {
  const ETH_PRIVATE_KEY = "0x3f493e59e81db1be4ebbe18b28ba8fdd066ef44139420ead59f37f5dacb80719";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

function getAlgoSigner(): AlgorandSigner {
  const mn = "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgorandSigner(mnemonicToSecretKey(mn));
}


(async function () {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const sol = new Solana();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const sol_sgn = getSolSigner();

  // Asset we want to transfer
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };

  // Create Attestation
  //const attestation: WormholeAttestation = {
  //  origin: algo_asset,
  //  sender: algo_sgn,
  //  destination: sol,
  //  receiver: sol_sgn
  //};


  const sol_asset = await wh.getMirrored(algo_asset, sol)
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
  }

  console.log("Algo=>Sol", await wh.claim(sol_sgn, await wh.transfer(xferAlgoSol), sol_asset));
  console.log("Sol=>Algo", await wh.claim(algo_sgn, await wh.transfer(xferSolAlgo), algo_asset));

})();
