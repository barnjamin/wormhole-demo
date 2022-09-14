from copy import copy
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
from contract import PingPong, _ping, _pong
from tmpl_sig import TmplSig


# Testnet app id for core bridge
WORMHOLE_CORE_ID = 86525623
WORMHOLE_CORE_ADDR = get_application_address(WORMHOLE_CORE_ID)

ACCOUNT_MNEMONIC = "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit"
ACCOUNT_ADDRESS = to_public_key(ACCOUNT_MNEMONIC)
ACCOUNT_SECRET = to_private_key(ACCOUNT_MNEMONIC)


ALGOD_HOST = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = "a" * 64


def get_storage_account(emitter_addr: str) -> transaction.LogicSigAccount:
    ts = TmplSig()
    return ts.populate(
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


def demo(app_id: int = 0, app_addr: str = ""):

    signer = AccountTransactionSigner(ACCOUNT_SECRET)

    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_HOST)

    # Create  an app client for our app
    app_client = client.ApplicationClient(
        algod_client, PingPong(version=6), signer=signer, app_id=app_id
    )

    # Deploy the app on chain
    app_id, app_addr, _ = app_client.create()
    print(f"Deployed app: {app_id}")
    app_client.fund(2 * consts.algo)

    print(f"App addr: {app_addr}")

    lsa = get_storage_account(app_addr)

    app_client.call(
        PingPong.configure, app_id=WORMHOLE_CORE_ID, storage_acct=lsa.address()
    )
    print("Configured settings")

    initialize_storage(algod_client, lsa, ACCOUNT_ADDRESS, signer)
    print("Initialized storage")

    result = app_client.call(
        PingPong.kickstart, storage_account=lsa.address(), core_app_id=WORMHOLE_CORE_ID
    )
    print(result.tx_info)


if __name__ == "__main__":
    app_id = 109938718
    app_addr = get_application_address(app_id) if app_id != 0 else ""
    demo(app_id=app_id, app_addr=app_addr)
