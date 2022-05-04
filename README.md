Demo prep for wormhole hackathon (https://www.activate.build/miami)


Completely Untested, just organizing API


Wormhole is a fancy multisig bridge with 19 "guardian" validators that watch blocks on the chains they're connected to. When they see a relevant transaction on some originating chain, they sign a VAA. Once a sufficient number of the guardians sign the VAA it can be passed to the target chain to create an asset or claim tokens for an asset.

This repo just formalizes the API and hides specific chain details in a WormholeChain interface


### TODO:

Actually test it

Implement more chains

Add other message types (payload 3?)

Build some demo programs for fun stuff 

    - message service where specific token xfer w/note represents a message? 
    - xfer oracle data like randomness?


