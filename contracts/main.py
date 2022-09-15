import base64
from algosdk.future import transaction
from algosdk.encoding import decode_address
from algosdk.atomic_transaction_composer import (
    AccountTransactionSigner,
    AtomicTransactionComposer,
    TransactionWithSigner,
    LogicSigTransactionSigner,
)
from algosdk.mnemonic import to_private_key, to_public_key
from algosdk.v2client import algod
from algosdk.logic import get_application_address

from beaker import *

from contract import PingPong
from tmpl_sig import TmplSig

# RPC connection parameters
ALGOD_HOST = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Testnet app id for core bridge
WORMHOLE_CORE_ID = 86525623
WORMHOLE_CORE_ADDR = get_application_address(WORMHOLE_CORE_ID)

# Generated account with algos on Testnet
ACCOUNT_MNEMONIC = "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit"
ACCOUNT_ADDRESS = to_public_key(ACCOUNT_MNEMONIC)
ACCOUNT_SECRET = to_private_key(ACCOUNT_MNEMONIC)
ACCOUNT_SIGNER = AccountTransactionSigner(ACCOUNT_SECRET)

# our PingPong app id
APP_ID = 110207597


def get_storage_account(emitter_addr: str) -> transaction.LogicSigAccount:
    return TmplSig().populate(
        {
            "TMPL_ADDR_IDX": 0,
            "TMPL_EMITTER_ID": decode_address(emitter_addr).hex(),
            "TMPL_APP_ID": WORMHOLE_CORE_ID,
            "TMPL_APP_ADDRESS": decode_address(WORMHOLE_CORE_ADDR).hex(),
        }
    )


def initialize_storage(
    client: algod.AlgodClient,
    lsa: transaction.LogicSigAccount,
    funder: str,
    signer: AccountTransactionSigner,
):
    sp = client.suggested_params()
    sp.flat_fee = True
    sp.fee = 2000

    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            txn=transaction.PaymentTxn(funder, sp, lsa.address(), 1002000),
            signer=signer,
        )
    )

    sp.fee = 0
    atc.add_transaction(
        TransactionWithSigner(
            txn=transaction.ApplicationCallTxn(
                lsa.address(),
                sp,
                WORMHOLE_CORE_ID,
                transaction.OnComplete.OptInOC,
                rekey_to=WORMHOLE_CORE_ADDR,
            ),
            signer=LogicSigTransactionSigner(lsa),
        )
    )
    result = atc.execute(client, 4)
    print(f"Opted in at round: {result.confirmed_round}")


def demo(app_id: int = 0):

    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_HOST)

    # Create  an app client for our app
    app_client = client.ApplicationClient(
        algod_client, PingPong(version=6), signer=ACCOUNT_SIGNER, app_id=app_id
    )

    if app_id == 0:
        # Deploy the app on chain
        app_id, _, _ = app_client.create()
        print(f"Deployed app: {app_id}")

        # TODO add this to another group or dont wait
        app_client.fund(2 * consts.algo)
        print(f"Funded app")

        # Set up our storage for the core contract
        lsa = get_storage_account(get_application_address(app_id))

        initialize_storage(algod_client, lsa, ACCOUNT_ADDRESS, ACCOUNT_SIGNER)
        print("Initialized storage for core contract sequence tracking")

        # Set app state vals for params
        app_client.call(
            PingPong.configure, app_id=WORMHOLE_CORE_ID, storage_acct=lsa.address()
        )
        print("Configured settings")

    # Kickstart the ping pong
    print("Calling kickstart")
    result = app_client.call(PingPong.kickstart)
    raw_seq = result.tx_info["inner-txns"][0]["logs"][0]
    seq = int.from_bytes(base64.b64decode(raw_seq), "big")
    print(f"Message assigned sequence number: {seq}")

    # TODO:
    # while True:
    #     # relay VAAs


if __name__ == "__main__":
    demo(app_id=APP_ID)
