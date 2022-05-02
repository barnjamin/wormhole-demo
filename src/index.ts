import algosdk from 'algosdk';
import  {
  CHAIN_ID_ETH,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_AVAX,
} from '@certusone/wormhole-sdk';


const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const server = 'http://127.0.0.1';
const port = 4001;
const client = new algosdk.Algodv2(token, server, port);

(async function(){

    //const sp = await client.getTransactionParams().do()
    //console.log(sp)

    

    console.log(CHAIN_ID_ETH)
    console.log(CHAIN_ID_ALGORAND)
    console.log(CHAIN_ID_AVAX)

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