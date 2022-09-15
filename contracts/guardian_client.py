import grpc
import algosdk
from gen.publicrpc.v1.publicrpc_pb2 import (
    GetSignedVAARequest,
    CHAIN_ID_ALGORAND,
    MessageID,
)
from gen.publicrpc.v1.publicrpc_pb2_grpc import PublicRPCServiceStub


def run():

    app_id = 110207597
    app_addr = algosdk.logic.get_application_address(app_id)
    app_addr_hex = algosdk.encoding.decode_address(app_addr).hex()
    host = "wormhole-v2-testnet-api.certus.one"
    seq = 1

    with grpc.secure_channel(host, grpc.ssl_channel_credentials()) as channel:
        stub = PublicRPCServiceStub(channel)
        msg = MessageID(
            emitter_chain=CHAIN_ID_ALGORAND,
            emitter_address=app_addr_hex,
            sequence=seq,
        )
        result = stub.GetSignedVAA(GetSignedVAARequest(message_id=msg))
        print(result)


if __name__ == "__main__":
    run()
