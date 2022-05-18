from inspect import currentframe
from typing import cast
from pyteal import *
from vaa import PythTransferVAA, parse_pyth_vaa


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
def bootstrap(app_id: abi.Uint64, *, output: abi.Uint64):
    return Seq(
        App.globalPut("coreId", app_id),
        output.set(app_id)
    )


debug = True 
def DebugAssert(cond: Expr):
    if debug:
        return Assert(And(cond, Int(currentframe().f_back.f_lineno)))
    else:
        return Assert(cond)


@router.add_method_handler
@ABIReturnSubroutine
def pyth_publish( 
    vaa: abi.DynamicArray[abi.Byte], *, output: abi.DynamicArray[abi.Byte]
) -> Expr:
    return Seq(
        (tidx := ScratchVar()).set(Txn.group_index() - Int(1)),

        # Make sure we were called in a group with the core contract that verifies the VAA
        DebugAssert(Gtxn[tidx.load()].type_enum() == TxnType.ApplicationCall),
        DebugAssert(Gtxn[tidx.load()].application_id() == App.globalGet(Bytes("coreid"))),
        DebugAssert(Gtxn[tidx.load()].application_args[0] == Bytes("verifyVAA")),
        DebugAssert(Gtxn[tidx.load()].sender() == Txn.sender()),
        DebugAssert(Gtxn[tidx.load()].application_args[1] == Txn.application_args[1]),

        #TODO dupe suppression


        (s := abi.String()).decode(vaa.encode()),
        (ptvaa := PythTransferVAA()).decode(parse_pyth_vaa(s.get())),
        # TODO: parse out stuff? write to state values?


        output.set(ptvaa.payload())
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
