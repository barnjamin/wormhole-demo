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
  mnemonicToSecretKey,
} from "algosdk";
import { ethers } from "ethers";

import {
  Connection,
  Keypair,
  PublicKey,
  TokenAccountsFilter,
  Transaction,
} from "@solana/web3.js";

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


class SolanaSigner {
  keypair: Keypair;
  constructor(privateKey: Uint8Array){
      this.keypair = Keypair.fromSecretKey(privateKey);
  }

  getAddress(){
      return this.keypair.publicKey.toString();    
  }
  async signTxn(txn: Transaction): Promise<Buffer> {
    txn.partialSign(this.keypair)
    return txn.serialize()
  }

}


function getEthSigner(provider: any) {
  //const ETH_PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
  const ETH_PRIVATE_KEY = "0x3f493e59e81db1be4ebbe18b28ba8fdd066ef44139420ead59f37f5dacb80719";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

function getAlgoSigner(acct?: algosdk.Account): AlgoSigner {
  const mn =
    "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgoSigner(mnemonicToSecretKey(mn));
}

(async function () {
  // Main wh interface, allows for {mirror, transfer, and attest, receive, getVaa}
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);
  console.log(WORMHOLE_RPC_HOSTS);

  console.log("Made wormhole");

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const eth = new Ethereum();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner();
  const eth_sgn = getEthSigner(eth.provider);

  console.log("Created Signers ");

  // Asset we want to transfer
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  };

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

  const eth_asset = await wh.getMirrored(algo_asset, eth)

  //let eth_asset: WormholeAsset;
  //try {
  //  eth_asset = await eth.createWrapped(eth_sgn, receipt);
  //}catch(e){
  //  //console.error("Failed: ", e)
  //}
  //eth_asset = await eth.updateWrapped(eth_sgn, receipt);
  //console.log("Successfully wrapped")
  //console.log(eth_asset)

  // transmit from src chain into wormhole
  // receipt is the VAA to be used on target chain
  const xferAlgoEth: WormholeMessage = {
    type: WormholeMessageType.TokenTransfer,
    tokenTransfer: {
      origin: algo_asset,
      sender: algo_sgn,
      destination: eth_asset,
      receiver: eth_sgn,
      amount: BigInt(100),
    },
  };
  const xferEthAlgo: WormholeMessage = {
    type: WormholeMessageType.TokenTransfer,
    tokenTransfer: {
      destination: algo_asset,
      receiver: algo_sgn,
      origin: eth_asset,
      sender: eth_sgn,
      amount: BigInt(100),
    },
  };

  console.log("Getting vaa for 29")
  const vaa = await wh.getVAA("29", algo)
  console.log("Got vaa ", vaa)

  console.log(await eth.redeem(eth_sgn, vaa))
  
  //console.log(await wh.send(xferAlgoEth));
  //console.log(await wh.send(xferEthAlgo));

  // Alternatively:
  // await wh.receive(eth_sgn, await wh.transmit(xferMsg.tokenTransfer))
})();
