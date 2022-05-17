from typing import cast
from pyteal import *
from vaa import ContractTransferVAA, parse_contract_transfer_vaa


router = Router()
router.add_bare_call(Approve(), OnComplete.NoOp, creation=True)
router.add_bare_call(Approve(), OnComplete.UpdateApplication)


@router.add_method_handler
@ABIReturnSubroutine
def portal_transfer(
    vaa: abi.DynamicArray[abi.Byte], *, output: abi.DynamicArray[abi.Byte]
) -> Expr:

    logstr = abi.String()
    return Seq(
        (s := abi.String()).decode(vaa.encode()),
        (ctvaa := ContractTransferVAA()).decode(parse_contract_transfer_vaa(s.get())),
        #Log(ctvaa.encode()),
        #cast(abi.TupleElement, ctvaa.payload()).use(lambda s: Log(s.get())),
        output.decode(s.encode())
        #output.set(vaa)
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
                approval, mode=Mode.Application, version=6, assembleConstants=True, optimize=OptimizeOptions(scratch_slots=True)
            )
        )

    with open(os.path.join(path, "clear.teal"), "w") as f:
        f.write(
            compileTeal( 
                clear, mode=Mode.Application, version=6, assembleConstants=True, optimize=OptimizeOptions(scratch_slots=True)
            )
        )
