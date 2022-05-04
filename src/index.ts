import {
  Wormhole,
  WormholeAsset,
  WormholeMessage,
  WormholeMessageType,
} from "./wormhole";
import { Ethereum, getEthProvider } from "./ethereum";
import { Algorand } from "./algorand";
import algosdk, { generateAccount } from "algosdk";
import { ethers } from "ethers";

class AlgoSigner {
  account: algosdk.Account;

  constructor(acct?: algosdk.Account) {
    this.account = acct === undefined? generateAccount(): acct;
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
  return new AlgoSigner(acct);
}


(async function () {
  // Main wh interface, allows for mirror/transmit/receive
  const wh = new Wormhole();

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const eth = new Ethereum();

  // Get chain specific signers
  const algo_sgn = getAlgoSigner(); 
  const eth_sgn = getEthSigner(getEthProvider());

  // Asset we want to transfer 
  const algo_asset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0),
  } 

  // Create Attestation 
  const attestMsg: WormholeMessage = {
    type: WormholeMessageType.Attestation,
    attestation: {
      origin: algo_asset,
      sender: algo_sgn,
      destination: eth,
      receiver: eth_sgn
    }
  }
  const eth_asset = await wh.send(attestMsg);
  // Alternatively:
  // const eth_asset = await wh.mirror(attestMsg.attestation)

  // transmit from src chain into wormhole
  // receipt is the VAA to be used on target chain
  const xferMsg: WormholeMessage = {
    type: WormholeMessageType.TokenTransfer,
    tokenTransfer: {
      origin: algo_asset,
      sender: algo_sgn,
      destination: eth_asset,
      receiver: eth_sgn,
      // TODO: note? App call?
      amount: BigInt(100),
    }
  }

  await wh.send(xferMsg);

  // Alternatively:
  // await wg.receive(eth_sgn, await wg.transmit(xferMsg.tokenTransfer))
})();
