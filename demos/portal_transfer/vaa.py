from typing import Callable, Literal, List
from pyteal import *


class NamedTuple(abi.Tuple):
    def __init__(self):
        self.type_specs = {k: abi.make(v).type_spec() for k, v in self.__annotations__.items()}
        self.field_names = list(self.type_specs.keys())

        for idx in range(len(self.field_names)):
            name = self.field_names[idx]
            setattr(self, name, self.getter(idx))

        super().__init__(abi.TupleTypeSpec(*self.type_specs.values()))

    def getter(self, idx) -> Callable:
        return lambda: self.__getitem__(idx)

    def __str__(self) -> str:
        return super().type_spec().__str__()


class ContractTransferVAA(NamedTuple):
    version: abi.Uint8 # Version of VAA
    index: abi.Uint32 #  Which guardian set to be validated against
    siglen: abi.Uint8 # How many signatures
    timestamp: abi.Uint32 # TS of message
    nonce: abi.Uint32 # Uniquifying  
    chain: abi.Uint16 # The Id of the chain where the message originated
    emitter: abi.Address  # The address of the contract that emitted this message on the origin chain
    sequence: abi.Uint64 # Unique integer representing the index, used for dedupe/ordering 
    consistency: abi.Uint8 # 

    type: abi.Uint8 # Type of message
    amount: abi.Address # amount of transfer
    contract: abi.Address # asset transferred
    from_chain: abi.Uint16 # Id of the chain the token originated
    to_address: abi.Address # Receiver of the token transfer
    to_chain: abi.Uint16 # Id of the chain where the token transfer should be redeemed
    fee: abi.Address # Amount to pay relayer
    payload: abi.DynamicArray[abi.Byte] # Arbitrary byte payload


def move_offset(offset: ScratchVar, t: abi.BaseType) -> Expr:
    return offset.store(offset.load() + Int(t.type_spec().byte_length_static()))


@Subroutine(TealType.bytes)
def parse_contract_transfer_vaa(vaa) -> Expr:
    # TODO: assert some checks here to make sure everything looks right
    return Seq(
        (offset := ScratchVar()).store(Int(0)),
        (version := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, version),
        (index := abi.Uint32()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, index),
        (siglen := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        # Increase offset to skip over sigs && digest
        offset.store(
            offset.load()
            + Int(siglen.type_spec().byte_length_static())
            + (siglen.get() * Int(66))
        ),
        (timestamp := abi.Uint32()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, timestamp),
        (nonce := abi.Uint32()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, nonce),
        (chain := abi.Uint16()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, chain),
        (emitter := abi.Address()).decode(
            vaa, startIndex=offset.load(), length=Int(32)
        ),
        move_offset(offset, emitter),
        (sequence := abi.Uint64()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, sequence),
        (consistency := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, consistency),
        (type := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, type),
        (amount := abi.Address()).decode(vaa, startIndex=offset.load(), length=Int(32)),
        move_offset(offset, amount),
        (contract := abi.Address()).decode(
            vaa, startIndex=offset.load(), length=Int(32)
        ),
        move_offset(offset, contract),
        (from_chain := abi.Uint16()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, from_chain),
        (to_address := abi.Address()).decode(
            vaa, startIndex=offset.load(), length=Int(32)
        ),
        move_offset(offset, to_address),
        (to_chain := abi.Uint16()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, to_chain),
        (fee := abi.Address()).decode(vaa, startIndex=offset.load(), length=Int(32)),
        move_offset(offset, fee),
        (payload := abi.String).set(Suffix(vaa, offset.load())),
        (ctvaa := ContractTransferVAA()).set(
            version,
            index,
            siglen,
            timestamp,
            nonce,
            chain,
            emitter,
            sequence,
            consistency,
            type,
            amount,
            contract,
            from_chain,
            to_address,
            to_chain,
            fee,
            payload_bytes,
        ),
        ctvaa.encode(),
    )