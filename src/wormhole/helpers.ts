import { Connection } from "@solana/web3.js";
import { Algodv2 } from "algosdk";
import { ethers } from "ethers";
import { ALGORAND_HOST, SOLANA_HOST, TERRA_HOST } from "./consts";
import { mnemonicToSecretKey } from "algosdk";
import { Signer, WormholeChain } from "./wormhole";
import { Algorand, AlgorandSigner } from "./chains/algorand";
import { Ethereum, EthereumSigner } from "./chains/ethereum";
import { Solana, SolanaSigner } from "./chains/solana";
import { Avalanche, AvalancheSigner } from "./chains/avalanche";
import { Coins, LCDClient } from "@terra-money/terra.js";
import { Polygon } from "./chains/polygon";

type GetSignerFn = (client?: any) => Signer;
type GetClientFn = () => any;
type GetChainFn = (client: any) => WormholeChain;

type ChainConfig = {
  chain: GetChainFn;
  getSigner: GetSignerFn;
  getClient: GetClientFn;
};

export const ChainConfigs: { [key: string]: ChainConfig } = {
  algorand: {
    chain: (client: any) => new Algorand(client),
    getSigner: getAlgoSigner,
    getClient: getAlgoConnection,
  },
  solana: {
    chain: (client: any) => new Solana(client),
    getSigner: getSolSigner,
    getClient: getSolConnection,
  },
  ethereum: {
    chain: (client: any) => new Ethereum(client),
    getSigner: getEthSigner,
    getClient: getEthConnection,
  },
  avalanche: {
    chain: (client: any) => new Avalanche(client),
    getSigner: getAvaxSigner,
    getClient: getAvaxConnection,
  },
  polygon: {
    chain: (client: any) => new Polygon(client),
    getSigner: getPolygonSigner,
    getClient: getPolygonConnection,
  },
};

export function initChain(cc: ChainConfig): [WormholeChain, Signer] {
  const conn = cc.getClient();
  const chain = cc.chain(conn);
  const signer = cc.getSigner(conn);
  return [chain, signer];
}

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
  const url =
    "https://speedy-nodes-nyc.moralis.io/236c92ab480d8cafac91f211/avalanche/testnet";
  return new ethers.providers.JsonRpcProvider(url);
}

export function getPolygonConnection(): ethers.providers.Provider {
  const url = "https://polygon-mumbai.g.alchemy.com/v2/FaI35t5qVP8XY1SSALBW7S2fO3GsKTZ-"
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

// Plz dont steal all my testnet money

export function getAlgoSigner(): AlgorandSigner {
  const mn =
    "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgorandSigner(mnemonicToSecretKey(mn));
}

export function getSolSigner(): SolanaSigner {
  const pk =
    "2v5fKQHaDLuWYBQCzFGvovnRNXPy8jkErWkeSMigs1PdsnQvRC5EMX3CJdULaEaQqaMNagfhsoj8sfQ7Dn2MnjKy";
  return new SolanaSigner(pk);
}

export function getEthSigner(provider: any): EthereumSigner {
  const ETH_PRIVATE_KEY =
    "0x3f493e59e81db1be4ebbe18b28ba8fdd066ef44139420ead59f37f5dacb80719";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}

export function getAvaxSigner(provider: any): EthereumSigner {
  return getEthSigner(provider);
}

export function getPolygonSigner(provider: any): EthereumSigner {
  return getEthSigner(provider)
}