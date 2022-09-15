import grpc
from gen.publicrpc.v1.publicrpc_pb2 import GetSignedVAARequest, CHAIN_ID_ALGORAND, MessageID
from gen.publicrpc.v1.publicrpc_pb2_grpc import PublicRPCServiceStub 

def run():

    host = "https://wormhole-v2-testnet-api.certus.one"
    with grpc.insecure_channel(host) as channel:
        stub = PublicRPCServiceStub(channel)
        msg = MessageID(
            emitter_chain=CHAIN_ID_ALGORAND,
            emitter_address='deadbeef',
            sequence=1,
        )
        result = stub.GetSignedVAA(GetSignedVAARequest(message_id=msg))
        print(result)


if __name__ == '__main__':
    run()