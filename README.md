Demo prep for wormhole hackathon (https://www.activate.build/miami)

[Github](https://github.com/certusone/wormhole)

[NPM](https://www.npmjs.com/package/@certusone/wormhole-sdk)

[Testnet Bridge](https://certusone.github.io/wormhole/#/transfer)

[Production Bridge](https://www.portalbridge.com/#/transfer)


Wormhole is a multisig bridge with 19 "guardian" validators that watch blocks on the chains they're connected to. When they see a relevant transaction on some originating chain, they sign a VAA. Once a sufficient number of the guardians sign the VAA it can be passed to the target chain to create an asset or claim tokens for an asset.


Run with
```sh
git clone https://github.com/algorand-devrel/wormhole-demo 
cd wormhole-demo
npm install
```

Tweak the keys and clients in `src/wormhole/helpers.ts`
Tweak the method calls in index.ts
```sh
npm run demo
```


### TODO:

Nontrivial demos:

    - [ ]  message service where specific token xfer w/note represents a message? 

    - [ ]  xfer oracle data like randomness?

    - [ ]  X chain DLL ("why would you do this?")


Testing?

ContractTransfer/Redeem w/ !Algorand chains

#### Chains

- [x] Algorand
- [x] Ethereum
- [x] Solana
- [x] Avalanche


