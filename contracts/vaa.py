from typing import Callable, Literal, List
from pyteal import *


class NamedTuple(abi.Tuple):
    def __init__(self):
        self.type_specs = {k: v().type_spec() for k, v in self.__annotations__.items()}
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
    version: abi.Uint8
    index: abi.Uint32
    siglen: abi.Uint8
    timestamp: abi.Uint32
    nonce: abi.Uint32
    chain: abi.Uint16
    emitter: abi.Address
    sequence: abi.Uint64
    consistency: abi.Uint8

    type: abi.Uint8
    amount: abi.Address
    contract: abi.Address
    from_chain: abi.Uint16
    to_address: abi.Address
    to_chain: abi.Uint16
    fee: abi.Address
    payload: abi.String


def move_offset(offset: ScratchVar, t: abi.BaseType) -> Expr:
    return offset.store(offset.load() + Int(t.type_spec().byte_length_static()))

@Subroutine(TealType.bytes)
def parse_contract_transfer_vaa(vaa) -> Expr:
    #TODO: assert some checks here to make sure everything looks right
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
        (emitter := abi.Address()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, emitter),
        (sequence := abi.Uint64()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, sequence),
        (consistency := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, consistency),
        (type := abi.Uint8()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, type),
        (amount := abi.Address()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, amount),
        (contract := abi.Address()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, contract),
        (from_chain := abi.Uint16()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, from_chain),
        (to_address := abi.Address()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, to_address),
        (to_chain := abi.Uint16()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, to_chain),
        (fee := abi.Address()).decode(vaa, startIndex=offset.load()),
        move_offset(offset, fee),
        (payload := abi.String()).decode(vaa, startIndex=offset.load()),
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
            payload,
        ),
        ctvaa.encode()
    )


# export function _parseVAAAlgorand(vaa: Uint8Array): Map<string, any> {
#  let ret = new Map<string, any>();
#  let buf = Buffer.from(vaa);
#  ret.set("version", buf.readIntBE(0, 1));
#  ret.set("index", buf.readIntBE(1, 4));
#  ret.set("siglen", buf.readIntBE(5, 1));
#  const siglen = ret.get("siglen");
#  if (siglen) {
#    ret.set("signatures", extract3(vaa, 6, siglen * 66));
#  }
#  const sigs = [];
#  for (let i = 0; i < siglen; i++) {
#    const start = 6 + i * 66;
#    const len = 66;
#    const sigBuf = extract3(vaa, start, len);
#    sigs.push(sigBuf);
#  }
#  ret.set("sigs", sigs);
#  let off = siglen * 66 + 6;
#  ret.set("digest", vaa.slice(off)); // This is what is actually signed...
#  ret.set("timestamp", buf.readIntBE(off, 4));
#  off += 4;
#  ret.set("nonce", buf.readIntBE(off, 4));
#  off += 4;
#  ret.set("chainRaw", Buffer.from(extract3(vaa, off, 2)).toString("hex"));
#  ret.set("chain", buf.readIntBE(off, 2));
#  off += 2;
#  ret.set("emitter", Buffer.from(extract3(vaa, off, 32)).toString("hex"));
#  off += 32;
#  ret.set("sequence", buf.readBigUInt64BE(off));
#  off += 8;
#  ret.set("consistency", buf.readIntBE(off, 1));
#  off += 1;
#
#  ret.set("Meta", "Unknown");

#  if (buf.readIntBE(off, 1) === 3) {
#    ret.set("Meta", "TokenBridge Transfer With Payload");
#    ret.set("Type", buf.readIntBE(off, 1));
#    off += 1;
#    ret.set("Amount", extract3(vaa, off, 32));
#    off += 32;
#    ret.set("Contract", uint8ArrayToHex(extract3(vaa, off, 32)));
#    off += 32;
#    ret.set("FromChain", buf.readIntBE(off, 2));
#    off += 2;
#    ret.set("ToAddress", extract3(vaa, off, 32));
#    off += 32;
#    ret.set("ToChain", buf.readIntBE(off, 2));
#    off += 2;
#    ret.set("Fee", extract3(vaa, off, 32));
#    off += 32;
#    ret.set("Payload", vaa.slice(off));
#  }
#
#  return ret;
# }
