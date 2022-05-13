from pyteal import *


@ABIReturnSubroutine
def payload3(vaa: abi.String, *, output: abi.String)->Expr:
    #TODO: something interesting    
    return output.set(vaa.get())

router = Router()
router.on_bare_app_call(Approve(), OnComplete.NoOp, creation=True)
router.on_bare_app_call(Approve(), OnComplete.UpdateApplication)
router.on_method_call(payload3)
approval, clear, iface = router.build_program()

if __name__ == "__main__":
    import os
    import json

    path = os.path.dirname(os.path.abspath(__file__))

    with open(os.path.join(path, "abi.json"), "w") as f:
        f.write(json.dumps(iface))

    with open(os.path.join(path, "approval.teal"), "w") as f:
        f.write(
            compileTeal(
                approval, mode=Mode.Application, version=6, assembleConstants=True
            )
        )

    with open(os.path.join(path, "clear.teal"), "w") as f:
        f.write(
            compileTeal(clear, mode=Mode.Application, version=6, assembleConstants=True)
        )