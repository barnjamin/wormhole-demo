Demo prep for xHack (https://xhack.splashthat.com/)

[Github](https://github.com/wormhole-foundation/wormhole)

[NPM](https://www.npmjs.com/package/@certusone/wormhole-sdk)

[Testnet Bridge](https://wormhole-foundation.github.io/example-token-bridge-ui/#/transfer)

[Production Bridge](https://www.portalbridge.com/#/transfer)


Wormhole is a multisig bridge with 19 "guardian" validators that watch blocks on the chains they're connected to. 

When they see a relevant transaction on some originating chain, they sign a VAA. 

Once a sufficient number of the guardians sign the VAA it can be passed to the target chain to create an asset or claim tokens for an asset.


Run with
```sh
git clone https://github.com/algorand-devrel/wormhole-demo 
cd wormhole-demo
npm install
```

Please change the keys in `src/wormhole/helpers.ts`

For a roundtrip asset transfer:

```sh
npm run roundtrip 
```

or for an arbitrary message passing:

```sh
npm run message
```

### TODO

Testing? (lol)

ContractTransfer/Redeem w/ !Algorand chains