import base64
from algosdk import *
from algosdk.v2client import algod
from algosdk.future.transaction import *
from pyteal import Mode, OptimizeOptions, compileTeal
#from pyth_contract import router
from demos.portal_transfer.portal_transfer_contract import router

mn = "tenant helmet motor sauce appear buddy gloom park average glory course wire buyer ostrich history time refuse room blame oxygen film diamond confirm ability spirit"
host = "https://testnet-api.algonode.cloud"
token = ""


def get_account(mn):
    sk = mnemonic.to_private_key(mn)
    pk = account.address_from_private_key(sk)
    return pk, sk


def create_app(
    client: algod.AlgodClient, addr: str, pk: str, approval: str, clear: str
) -> int:
    # Get suggested params from network
    sp = client.suggested_params()

    print("Compiling approval program")
    # Read in approval teal source && compile
    app_result = client.compile(approval)
    app_bytes = base64.b64decode(app_result["result"])

    print("Compiling clear program")
    # Read in clear teal source && compile
    clear_result = client.compile(clear)
    clear_bytes = base64.b64decode(clear_result["result"])

    # We dont need no stinkin storage
    schema = StateSchema(0, 0)

    # Create the transaction
    create_txn = ApplicationCreateTxn(
        addr,
        sp,
        0,
        app_bytes,
        clear_bytes,
        schema,
        schema,
    )

    # Sign it
    signed_txn = create_txn.sign(pk)

    # Ship it
    txid = client.send_transaction(signed_txn)

    print("App create sent, waiting for confirmation")
    # Wait for the result so we can return the app id
    result = wait_for_confirmation(client, txid, 4)

    app_id = result["application-index"]
    app_addr = logic.get_application_address(app_id)

    # Send some Algos to the app address so it can do stuff
    sp = client.suggested_params()
    ptxn = PaymentTxn(addr, sp, app_addr, int(1e6))
    txid = client.send_transaction(ptxn.sign(sk))
    print("Payment sent, waiting for confirmation")
    wait_for_confirmation(client, txid, 4)

    return app_id, app_addr


def update_app(
    client: algod.AlgodClient, addr: str, pk: str, id: int, approval: str, clear: str
) -> int:
    # Get suggested params from network
    sp = client.suggested_params()

    print("Cmmpiling approval contract")
    # Read in approval teal source && compile
    app_result = client.compile(approval)
    app_bytes = base64.b64decode(app_result["result"])

    print("Compiling clear contract")
    # Read in clear teal source && compile
    clear_result = client.compile(clear)
    clear_bytes = base64.b64decode(clear_result["result"])

    # Create the transaction
    update_txn = ApplicationUpdateTxn(addr, sp, id, app_bytes, clear_bytes)

    # Sign it
    signed_txn = update_txn.sign(pk)

    # Ship it
    txid = client.send_transaction(signed_txn)

    print("Updating sent, waiting for confirmation")
    # Wait for the result
    result = wait_for_confirmation(client, txid, 4)
    print("Confirmed in round: {}".format(result["confirmed-round"]))


if __name__ == "__main__":
    approval, clear, iface = router.build_program()

    approval = compileTeal(
        approval,
        mode=Mode.Application,
        version=6,
        assembleConstants=True,
        optimize=OptimizeOptions(scratch_slots=True),
    )
    clear = compileTeal(
        clear,
        mode=Mode.Application,
        version=6,
        assembleConstants=True,
        optimize=OptimizeOptions(scratch_slots=True),
    )

    # with open("approval.teal", "r") as f:
    #    approval = f.read()

    # with open("clear.teal", "r") as f:
    #    clear = f.read()

    client = algod.AlgodClient(token, host)

    addr, sk = get_account(mn)

    # app_id, app_addr = create_app(client, addr, sk, approval, clear)
    # print(f"Created {app_id} with app address {app_addr}")

    update_app(client, addr, sk, 89737126, approval, clear)
