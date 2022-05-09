import { Connection } from "@solana/web3.js";
import { Algodv2 } from "algosdk";
import { ethers } from "ethers";
import { ALGORAND_HOST, AVAX_NETWORK_CHAIN_ID, COVALENT_AVAX, SOLANA_HOST } from "./consts";

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
    const apiKey = "ckey_0ff8d76eaa2d48ae93288faf2a2"
    return new ethers.providers.JsonRpcProvider(
        `https://api.covalenthq.com/v1/${AVAX_NETWORK_CHAIN_ID}/?&key=${apiKey}`
    )
}
