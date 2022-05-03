import { Wormhole, Signer, WormholeAsset, WormholeMessage, WormholeMessageType } from './wormhole';
import algosdk from 'algosdk';
import {Ethereum} from './ethereum'
import {Algorand} from './algorand'

(async function(){

    // Main wh interface, allows for mirror/transmit/receive
    const wh = new Wormhole()

    // Chain specific implementations of `WormholeChain` interface
    // they wrap specific methods and handle any weirdness 
    const algo = new Algorand()
    const eth = new Ethereum()

    // TODO: figure out a nice way to provide signer interface
    const algo_sgn = {} as Signer
    const eth_sgn = {} as Signer

    // TODO: obv invalid for algo
    // Maybe util method on WormholeChain to spit this out?
    const algo_asset = {
      chain: algo,
      contract: "0xdeadbeef",
    } as WormholeAsset

    // Make sure the asset exists on the target chain
    // Should check first either here or in method?
    const mirrored = await wh.mirror(algo_sgn, algo_asset, eth_sgn, eth)

    // transmit from src chain into wormhole
    // receipt is the VAA to be used on target chain
    const receipt = await wh.transmit({type: WormholeMessageType.TokenTransfer} as WormholeMessage)

    // Finally receive the asset on the target chain 
    // Using the VAA receipt we got above
    const received = await wh.receive(eth_sgn, receipt)



    //const sp = await client.getTransactionParams().do()
    //console.log(sp)
    //// Submit transaction - results in a Wormhole message being published
    //const transaction = await transferFromSolana(
    //connection,
    //SOL_BRIDGE_ADDRESS,
    //SOL_TOKEN_BRIDGE_ADDRESS,
    //payerAddress,
    //fromAddress,
    //mintAddress,
    //amount,
    //targetAddress,
    //CHAIN_ID_ETH,
    //originAddress,
    //originChain
    //);
    //const signed = await wallet.signTransaction(transaction);
    //const txid = await connection.sendRawTransaction(signed.serialize());
    //await connection.confirmTransaction(txid);
    //// Get the sequence number and emitter address required to fetch the signedVAA of our message
    //const info = await connection.getTransaction(txid);
    //const sequence = parseSequenceFromLogSolana(info);
    //const emitterAddress = await getEmitterAddressSolana(SOL_TOKEN_BRIDGE_ADDRESS);
    //// Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    //const { signedVAA } = await getSignedVAA(
    //WORMHOLE_RPC_HOST,
    //CHAIN_ID_SOLANA,
    //emitterAddress,
    //sequence
    //);
    //// Redeem on Ethereum
    //await redeemOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, signedVAA);

})()