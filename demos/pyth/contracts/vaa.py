from typing import Callable
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



def move_offset(offset: ScratchVar, t: abi.BaseType) -> Expr:
    return offset.store(offset.load() + Int(t.type_spec().byte_length_static()))

class PythTransferVAA(NamedTuple):
    version: abi.Uint8 # Version of VAA
    index: abi.Uint32 #  Which guardian set to be validated against
    siglen: abi.Uint8 # How many signatures
    timestamp: abi.Uint32 # TS of message
    nonce: abi.Uint32 # Uniquifying  
    chain: abi.Uint16 # The Id of the chain where the message originated
    emitter: abi.Address  # The address of the contract that emitted this message on the origin chain
    sequence: abi.Uint64 # Unique integer representing the index, used for dedupe/ordering 
    consistency: abi.Uint8 # 
    payload: abi.DynamicArray[abi.Byte] # Arbitrary byte payload


@Subroutine(TealType.bytes)
def parse_pyth_vaa(vaa)->Expr:
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
        (payload := abi.String()).set(Suffix(vaa, offset.load())),
        (payload_bytes := abi.make(abi.DynamicArray[abi.Byte])).decode(payload.encode()),
        (ptvaa := PythTransferVAA()).set(
            version,
            index,
            siglen,
            timestamp,
            nonce,
            chain,
            emitter,
            sequence,
            consistency,
            payload_bytes,
        ),
        ptvaa.encode(),
    )