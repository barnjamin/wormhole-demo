from typing import cast
from pyteal import *
from vaa import ContractTransferVAA, parse_contract_transfer_vaa


router = Router()
router.add_bare_call(Approve(), OnComplete.NoOp, creation=True)
router.add_bare_call(
    Return(Txn.sender() == Global.creator_address()), OnComplete.UpdateApplication
)
router.add_bare_call(
    Return(Txn.sender() == Global.creator_address()), OnComplete.DeleteApplication
)
router.add_bare_call(Reject(), OnComplete.OptIn)
router.add_bare_call(Reject(), OnComplete.CloseOut)
router.add_bare_call(Reject(), OnComplete.ClearState)


@router.add_method_handler
@ABIReturnSubroutine
def portal_transfer(
    vaa: abi.DynamicArray[abi.Byte], *, output: abi.DynamicArray[abi.Byte]
) -> Expr:
    return Seq(
        (s := abi.String()).decode(vaa.encode()),
        (ctvaa := ContractTransferVAA()).decode(parse_contract_transfer_vaa(s.get())),
        output.set(ctvaa.payload())
    )


if __name__ == "__main__":
    import os
    import json

    approval, clear, iface = router.build_program()

    path = os.path.dirname(os.path.abspath(__file__))

    with open(os.path.join(path, "abi.json"), "w") as f:
        f.write(json.dumps(iface))

    with open(os.path.join(path, "approval.teal"), "w") as f:
        f.write(
            compileTeal(
                approval,
                mode=Mode.Application,
                version=6,
                assembleConstants=True,
                optimize=OptimizeOptions(scratch_slots=True),
            )
        )

    with open(os.path.join(path, "clear.teal"), "w") as f:
        f.write(
            compileTeal(
                clear,
                mode=Mode.Application,
                version=6,
                assembleConstants=True,
                optimize=OptimizeOptions(scratch_slots=True),
            )
        )
