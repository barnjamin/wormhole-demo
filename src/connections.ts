import { Connection } from "@solana/web3.js";
import { Algodv2 } from "algosdk";
import { ethers } from "ethers";
import {
  ALGORAND_HOST,
  SOLANA_HOST,
  TERRA_HOST,
} from "./consts";

import {
  Coins,
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
} from "@terra-money/terra.js";

export function getSolConnection(): Connection {
  return new Connection(SOLANA_HOST, "confirmed");
}

export function getAlgoConnection(): Algodv2 {
  const { algodToken, algodServer, algodPort } = ALGORAND_HOST;
  return new Algodv2(algodToken, algodServer, algodPort);
}

export function getEthConnection(network?: string): ethers.providers.Provider {
  const apiKey = "2JKQAWARYH6QSI5QX5485DPHP3SN2EAI9Q";
  return new ethers.providers.EtherscanProvider(
    (network ||= "ropsten"),
    apiKey
  );
}

export function getAvaxConnection(): ethers.providers.Provider {
  const url = "https://speedy-nodes-nyc.moralis.io/236c92ab480d8cafac91f211/avalanche/testnet"
  return new ethers.providers.JsonRpcProvider(url);
}

export function getTerraConnection(): LCDClient {
  return new LCDClient({
    URL: TERRA_HOST.URL,
    chainID: TERRA_HOST.chainID,
    gasPrices: {
      uluna: 0.15,
    } as Coins.Input,
  });
}
