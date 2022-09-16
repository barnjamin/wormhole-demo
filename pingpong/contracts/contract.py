from typing import Final
from pyteal import *
from beaker import *

from wormhole import ContractTransferVAA, WormholeTransfer

_ping = b"ping"
_pong = b"pong"

Ping = Bytes(_ping)
Pong = Bytes(_pong)


class PingPong(WormholeTransfer):
    @external
    def kickstart(
        self,
        storage_account: abi.Account = WormholeTransfer.storage_account,
        core_app_id: abi.Application = WormholeTransfer.core_app_id,
    ):
        return self.publish_message(Ping)

    @delete(authorize=Authorize.only(Global.creator_address()))
    def delete(self):
        return Approve()

    def handle_transfer(
        self, ctvaa: ContractTransferVAA, *, output: abi.DynamicBytes
    ) -> Expr:
        """
        invoked from parent class `portal_transfer` after parsing the VAA into
        abi vars
        """
        return output.set(If(ctvaa.payload.get() == Ping, Pong, Ping))


if __name__ == "__main__":
    PingPong().dump("./artifacts")