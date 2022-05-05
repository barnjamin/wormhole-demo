process.env["REACT_APP_CLUSTER"] = "testnet";

import {
  Wormhole,
  WormholeAsset,
  WormholeAttestation,
  WormholeMessage,
  WormholeMessageType,
} from "./wormhole";
import { WORMHOLE_RPC_HOSTS } from "./consts";
import { Ethereum } from "./ethereum";
import { Algorand } from "./algorand";
import algosdk, {
  generateAccount,
  mnemonicFromSeed,
  mnemonicToSecretKey,
  secretKeyToMnemonic,
} from "algosdk";
import { ethers } from "ethers";
import { getOriginalAssetEth } from "@certusone/wormhole-sdk";

class AlgoSigner {
  account: algosdk.Account;

  constructor(acct?: algosdk.Account) {
    this.account = acct === undefined ? generateAccount() : acct;
  }

  getAddress(): string {
    return this.account.addr;
  }

  async signTxn(txn: algosdk.Transaction): Promise<Uint8Array> {
    return txn.signTxn(this.account.sk);
  }
}

function getEthSigner(provider: any) {
  const ETH_PRIVATE_KEY =
    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

function getAlgoSigner(acct?: algosdk.Account): AlgoSigner {
  const mn =
    "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgoSigner(mnemonicToSecretKey(mn));
}

(async function () {
  // Main wh interface, allows for {mirror, transmit, receive, getVaa}
  // TODO: What config should we pass? RPC address?
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);
  console.log(WORMHOLE_RPC_HOSTS);

  console.log("Made wormhole");

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const eth = new Ethereum();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  console.log(algo_sgn.getAddress())
  const eth_sgn = getEthSigner(eth.provider);
  console.log("Created Signers ");

  // Asset we want to transfer
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };

  //console.log(await wh.getOrigin(algo_asset));
  //console.log(await wh.getMirrored(algo_asset, eth));

  // Create Attestation
  const attestation: WormholeAttestation = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: eth,
    receiver: eth_sgn
  };

  //const seq = await algo.attest(attestation);
  //console.log("Got seq: ", seq);

  const seq = "18"

  const receipt = await wh.getVAA(seq, algo);
  console.log("Got VAA: ", receipt);

  const eth_asset = await eth.createWrapped(eth_sgn, receipt);
  console.log("Successfully wrapped")
  console.log(eth_asset)

  // Alternatively:
  // const eth_asset = await wh.mirror(attestMsg.attestation)

  // transmit from src chain into wormhole
  // receipt is the VAA to be used on target chain
  //const xferMsg: WormholeMessage = {
  //  type: WormholeMessageType.TokenTransfer,
  //  tokenTransfer: {
  //    origin: algo_asset,
  //    sender: algo_sgn,
  //    destination: eth_asset,
  //    receiver: eth_sgn,
  //    // TODO: note? App call?
  //    amount: BigInt(100),
  //  },
  //};

  //console.log("Created xfer message:", xferMsg)
  ////await wh.send(xferMsg);

  //// Alternatively:
  //// await wg.receive(eth_sgn, await wg.transmit(xferMsg.tokenTransfer))
})();
