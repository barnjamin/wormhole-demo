import {
  Wormhole,
  Signer,
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

  constructor() {
    this.account = generateAccount();
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

(async function () {
  // Main wh interface, allows for mirror/transmit/receive
  const wh = new Wormhole();

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  const algo = new Algorand();
  const eth = new Ethereum();

  // TODO: figure out a nice way to provide signer interface
  const algo_sgn = new AlgoSigner();
  const eth_sgn = getEthSigner(getEthProvider());

  // TODO: obv invalid for algo
  // Maybe util method on WormholeChain to spit this out?
  const algo_asset = {
    chain: algo,
    contract: BigInt(0),
  } as WormholeAsset;

  // Make sure the asset exists on the target chain
  // Should check first either here or in method?
  const mirrored = await wh.mirror(algo_sgn, algo_asset, eth_sgn, eth);

  // transmit from src chain into wormhole
  // receipt is the VAA to be used on target chain
  const receipt = await wh.transmit({
    type: WormholeMessageType.TokenTransfer,
  } as WormholeMessage);

  // Finally receive the asset on the target chain
  // Using the VAA receipt we got above
  const received = await wh.receive(eth_sgn, receipt);
})();
