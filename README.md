Demo prep for wormhole hackathon (https://www.activate.build/miami)

[Github](https://github.com/certusone/wormhole)

[NPM](https://www.npmjs.com/package/@certusone/wormhole-sdk)

[Testnet Bridge](https://certusone.github.io/wormhole/#/transfer)

[Production Bridge](https://www.portalbridge.com/#/transfer)


Wormhole is a multisig bridge with 19 "guardian" validators that watch blocks on the chains they're connected to. When they see a relevant transaction on some originating chain, they sign a VAA. Once a sufficient number of the guardians sign the VAA it can be passed to the target chain to create an asset or claim tokens for an asset.


Example:

```ts
  // Main wormhole class, takes `WormholeChain` interfaces and 
  // dispatches calls 
  const wh = new Wormhole(WORMHOLE_RPC_HOSTS);

  // Chain specific implementations of `WormholeChain` interface
  // they wrap specific methods and handle any weirdness
  // Pass each an instance of the client that can do lookups/send transactions 
  const algo = new Algorand(getAlgoConnection());
  const sol = new Solana(getSolConnection());

  // Get chain specific signers
  // Simple interface to get Address and sign transactions
  const algoSigner = getAlgoSigner();
  const solSigner = getSolSigner();

  // Asset we want to transfer
  const algoAsset: WormholeAsset = {
    chain: algo,
    contract: BigInt(0), // 0 is Algo, the native asset
  };

  // Get the details for the token that has been 
  // created on Solana to mirror the Algo 
  const solAsset = await wh.getMirrored(algoAsset, sol);

  // Construct a TokenTransfer to move the assets
  const xferAlgoSol: WormholeTokenTransfer = {
    origin: algo_asset,
    sender: algo_sgn,
    destination: sol_asset,
    receiver: sol_sgn,
    amount: BigInt(100),
  };

  // A `transfer` will return a `WormholeReceipt` containing
  // the Signed VAA and origin/destination chain references
  const receipt = await wh.transfer(xferAlgoSol);

  // Use the receipt to claim the asset on Solana side
  await wh.claim(solSigner, receipt, solAsset);
```


### TODO:

- [ ] Better examples

- [ ] Tests? (lol)

- [ ] Payload 3? 

- [ ] Nontrivial demos 

    - [ ] -  message service where specific token xfer w/note represents a message? 
    - [ ] -  xfer oracle data like randomness?
    - [ ] -  X chain DLL ("why would you do this?")



#### Chains

- [x] Algo: 

    - [x] - Attest new asset 
    - [x] - Xfer out 
    - [x] - Redeem with VAA 
    - [x] - Find original Asset

- [x] Eth:

    - [x] - Attest new asset 
    - [x] - Xfer out 
    - [x] - Redeem with VAA 
    - [x] - Find original asset

- [ ] Sol:

    - [ ] - Attest new asset 
    - [x] - Xfer out 
    - [x] - Redeem with VAA 
    - [x] - Find original asset
 

- [ ] Terra:

    - [ ] - Attest new asset 
    - [x] - Xfer out 
    - [x] - Redeem with VAA 
    - [x] - Find original asset

- [x] Avalanche:

    - [x] - Attest new asset 
    - [x] - Xfer out 
    - [x] - Redeem with VAA 
    - [x] - Find original asset


