# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: spy/v1/spy.proto
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database

# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from google.api import annotations_pb2 as google_dot_api_dot_annotations__pb2
from publicrpc.v1 import publicrpc_pb2 as publicrpc_dot_v1_dot_publicrpc__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n\x10spy/v1/spy.proto\x12\x06spy.v1\x1a\x1cgoogle/api/annotations.proto\x1a\x1cpublicrpc/v1/publicrpc.proto"j\n\rEmitterFilter\x12\x30\n\x08\x63hain_id\x18\x01 \x01(\x0e\x32\x15.publicrpc.v1.ChainIDR\x07\x63hainId\x12\'\n\x0f\x65mitter_address\x18\x02 \x01(\tR\x0e\x65mitterAddress"W\n\x0b\x46ilterEntry\x12>\n\x0e\x65mitter_filter\x18\x01 \x01(\x0b\x32\x15.spy.v1.EmitterFilterH\x00R\remitterFilterB\x08\n\x06\x66ilter"J\n\x19SubscribeSignedVAARequest\x12-\n\x07\x66ilters\x18\x01 \x03(\x0b\x32\x13.spy.v1.FilterEntryR\x07\x66ilters"9\n\x1aSubscribeSignedVAAResponse\x12\x1b\n\tvaa_bytes\x18\x01 \x01(\x0cR\x08vaaBytes2\x94\x01\n\rSpyRPCService\x12\x82\x01\n\x12SubscribeSignedVAA\x12!.spy.v1.SubscribeSignedVAARequest\x1a".spy.v1.SubscribeSignedVAAResponse"#\x82\xd3\xe4\x93\x02\x1d:\x01*"\x18/v1:subscribe_signed_vaa0\x01\x42\x8a\x01\n\ncom.spy.v1B\x08SpyProtoP\x01Z9github.com/certusone/wormhole/node/pkg/proto/spy/v1;spyv1\xa2\x02\x03SXX\xaa\x02\x06Spy.V1\xca\x02\x06Spy\\V1\xe2\x02\x12Spy\\V1\\GPBMetadata\xea\x02\x07Spy::V1b\x06proto3'
)


_EMITTERFILTER = DESCRIPTOR.message_types_by_name["EmitterFilter"]
_FILTERENTRY = DESCRIPTOR.message_types_by_name["FilterEntry"]
_SUBSCRIBESIGNEDVAAREQUEST = DESCRIPTOR.message_types_by_name[
    "SubscribeSignedVAARequest"
]
_SUBSCRIBESIGNEDVAARESPONSE = DESCRIPTOR.message_types_by_name[
    "SubscribeSignedVAAResponse"
]
EmitterFilter = _reflection.GeneratedProtocolMessageType(
    "EmitterFilter",
    (_message.Message,),
    {
        "DESCRIPTOR": _EMITTERFILTER,
        "__module__": "spy.v1.spy_pb2"
        # @@protoc_insertion_point(class_scope:spy.v1.EmitterFilter)
    },
)
_sym_db.RegisterMessage(EmitterFilter)

FilterEntry = _reflection.GeneratedProtocolMessageType(
    "FilterEntry",
    (_message.Message,),
    {
        "DESCRIPTOR": _FILTERENTRY,
        "__module__": "spy.v1.spy_pb2"
        # @@protoc_insertion_point(class_scope:spy.v1.FilterEntry)
    },
)
_sym_db.RegisterMessage(FilterEntry)

SubscribeSignedVAARequest = _reflection.GeneratedProtocolMessageType(
    "SubscribeSignedVAARequest",
    (_message.Message,),
    {
        "DESCRIPTOR": _SUBSCRIBESIGNEDVAAREQUEST,
        "__module__": "spy.v1.spy_pb2"
        # @@protoc_insertion_point(class_scope:spy.v1.SubscribeSignedVAARequest)
    },
)
_sym_db.RegisterMessage(SubscribeSignedVAARequest)

SubscribeSignedVAAResponse = _reflection.GeneratedProtocolMessageType(
    "SubscribeSignedVAAResponse",
    (_message.Message,),
    {
        "DESCRIPTOR": _SUBSCRIBESIGNEDVAARESPONSE,
        "__module__": "spy.v1.spy_pb2"
        # @@protoc_insertion_point(class_scope:spy.v1.SubscribeSignedVAAResponse)
    },
)
_sym_db.RegisterMessage(SubscribeSignedVAAResponse)

_SPYRPCSERVICE = DESCRIPTOR.services_by_name["SpyRPCService"]
if _descriptor._USE_C_DESCRIPTORS == False:

    DESCRIPTOR._options = None
    DESCRIPTOR._serialized_options = b"\n\ncom.spy.v1B\010SpyProtoP\001Z9github.com/certusone/wormhole/node/pkg/proto/spy/v1;spyv1\242\002\003SXX\252\002\006Spy.V1\312\002\006Spy\\V1\342\002\022Spy\\V1\\GPBMetadata\352\002\007Spy::V1"
    _SPYRPCSERVICE.methods_by_name["SubscribeSignedVAA"]._options = None
    _SPYRPCSERVICE.methods_by_name[
        "SubscribeSignedVAA"
    ]._serialized_options = (
        b'\202\323\344\223\002\035:\001*"\030/v1:subscribe_signed_vaa'
    )
    _EMITTERFILTER._serialized_start = 88
    _EMITTERFILTER._serialized_end = 194
    _FILTERENTRY._serialized_start = 196
    _FILTERENTRY._serialized_end = 283
    _SUBSCRIBESIGNEDVAAREQUEST._serialized_start = 285
    _SUBSCRIBESIGNEDVAAREQUEST._serialized_end = 359
    _SUBSCRIBESIGNEDVAARESPONSE._serialized_start = 361
    _SUBSCRIBESIGNEDVAARESPONSE._serialized_end = 418
    _SPYRPCSERVICE._serialized_start = 421
    _SPYRPCSERVICE._serialized_end = 569
# @@protoc_insertion_point(module_scope)