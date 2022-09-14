from beaker import *
from contract import PingPong, _ping, _pong


base_vaa = bytes.fromhex(
    "010000000001008049340af360a47103a962108cb57b9deebcc99e8e6ddeca1a"
    + "1fb025413a62ac2cae4abd6b7e0ce7fc5a6bc99536387a3827cbbb0c710c81213"
    + "a417cb59b89de01630d06ae0000000000088edf5b0e108c3a1a0a4b704cc89591"
    + "f2ad8d50df24e991567e640ed720a94be20000000000000004000300000000000"
    + "00000000000000000000000000000000000000000000000000064000000000000"
    + "0000000000000000000000000000000000000000000000000000000f6463fab1a"
    + "45027a3c70781ae588e4e6661d21a7c19535a5d6b4f4c3164a13be1000f0b7ef3"
    + "fcf3f8d9efc458695dc7bd7e534080ac7b48f2b881fd3063b1308f0648"
)


def demo():
    # Grab an account from the sandbox KMD
    account = sandbox.get_accounts().pop()

    # Create  an app client for our app
    app_client = client.ApplicationClient(
        sandbox.get_algod_client(),
        PingPong(),
        signer=account.signer,
    )

    # Deploy the app on chain
    app_client.create()

    # Send a ping, expect pong 
    result = app_client.call(
        PingPong.portal_transfer,
        vaa=base_vaa + _ping,
    )
    res = bytes(result.return_value)
    assert res == _pong


if __name__ == "__main__":
    demo()
