import { mnemonicToSecretKey } from "algosdk";
import { ethers } from "ethers";
import { AlgorandSigner } from "./algorand";
import { EthereumSigner } from "./ethereum";
import { SolanaSigner } from "./solana";

// Plz dont steal all my testnet money
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

export function getAlgoSigner(): AlgorandSigner {
  const mn =
    "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit";
  return new AlgorandSigner(mnemonicToSecretKey(mn));
}

export function getAvaxSigner(provider: any): EthereumSigner {
  const ETH_PRIVATE_KEY =
    "0x3f493e59e81db1be4ebbe18b28ba8fdd066ef44139420ead59f37f5dacb80719";
  return new ethers.Wallet(ETH_PRIVATE_KEY, provider);
}