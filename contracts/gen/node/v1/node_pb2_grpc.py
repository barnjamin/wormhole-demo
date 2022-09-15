# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from node.v1 import node_pb2 as node_dot_v1_dot_node__pb2


class NodePrivilegedServiceStub(object):
    """NodePrivilegedService exposes an administrative API. It runs on a UNIX socket and is authenticated
    using Linux filesystem permissions.
    """

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.InjectGovernanceVAA = channel.unary_unary(
                '/node.v1.NodePrivilegedService/InjectGovernanceVAA',
                request_serializer=node_dot_v1_dot_node__pb2.InjectGovernanceVAARequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.InjectGovernanceVAAResponse.FromString,
                )
        self.FindMissingMessages = channel.unary_unary(
                '/node.v1.NodePrivilegedService/FindMissingMessages',
                request_serializer=node_dot_v1_dot_node__pb2.FindMissingMessagesRequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.FindMissingMessagesResponse.FromString,
                )
        self.SendObservationRequest = channel.unary_unary(
                '/node.v1.NodePrivilegedService/SendObservationRequest',
                request_serializer=node_dot_v1_dot_node__pb2.SendObservationRequestRequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.SendObservationRequestResponse.FromString,
                )
        self.ChainGovernorStatus = channel.unary_unary(
                '/node.v1.NodePrivilegedService/ChainGovernorStatus',
                request_serializer=node_dot_v1_dot_node__pb2.ChainGovernorStatusRequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorStatusResponse.FromString,
                )
        self.ChainGovernorReload = channel.unary_unary(
                '/node.v1.NodePrivilegedService/ChainGovernorReload',
                request_serializer=node_dot_v1_dot_node__pb2.ChainGovernorReloadRequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorReloadResponse.FromString,
                )
        self.ChainGovernorDropPendingVAA = channel.unary_unary(
                '/node.v1.NodePrivilegedService/ChainGovernorDropPendingVAA',
                request_serializer=node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAARequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAAResponse.FromString,
                )
        self.ChainGovernorReleasePendingVAA = channel.unary_unary(
                '/node.v1.NodePrivilegedService/ChainGovernorReleasePendingVAA',
                request_serializer=node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAARequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAAResponse.FromString,
                )
        self.ChainGovernorResetReleaseTimer = channel.unary_unary(
                '/node.v1.NodePrivilegedService/ChainGovernorResetReleaseTimer',
                request_serializer=node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerRequest.SerializeToString,
                response_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerResponse.FromString,
                )


class NodePrivilegedServiceServicer(object):
    """NodePrivilegedService exposes an administrative API. It runs on a UNIX socket and is authenticated
    using Linux filesystem permissions.
    """

    def InjectGovernanceVAA(self, request, context):
        """InjectGovernanceVAA injects a governance VAA into the guardian node.
        The node will inject the VAA into the aggregator and sign/broadcast the VAA signature.

        A consensus majority of nodes on the network will have to inject the VAA within the
        VAA timeout window for it to reach consensus.

        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def FindMissingMessages(self, request, context):
        """FindMissingMessages will detect message sequence gaps in the local VAA store for a
        specific emitter chain and address. Start and end slots are the lowest and highest
        sequence numbers available in the local store, respectively.

        An error is returned if more than 1000 gaps are found.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def SendObservationRequest(self, request, context):
        """SendObservationRequest broadcasts a signed observation request to the gossip network
        using the node's guardian key. The network rate limits these requests to one per second.
        Requests at higher rates will fail silently.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ChainGovernorStatus(self, request, context):
        """ChainGovernorStatus displays the status of the chain governor.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ChainGovernorReload(self, request, context):
        """ChainGovernorReload clears the chain governor history and reloads it from the database.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ChainGovernorDropPendingVAA(self, request, context):
        """ChainGovernorDropPendingVAA drops a VAA from the chain governor pending list.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ChainGovernorReleasePendingVAA(self, request, context):
        """ChainGovernorReleasePendingVAA release a VAA from the chain governor pending list, publishing it immediately.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ChainGovernorResetReleaseTimer(self, request, context):
        """ChainGovernorResetReleaseTimer resets the release timer for a chain governor pending VAA to the configured maximum.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_NodePrivilegedServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'InjectGovernanceVAA': grpc.unary_unary_rpc_method_handler(
                    servicer.InjectGovernanceVAA,
                    request_deserializer=node_dot_v1_dot_node__pb2.InjectGovernanceVAARequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.InjectGovernanceVAAResponse.SerializeToString,
            ),
            'FindMissingMessages': grpc.unary_unary_rpc_method_handler(
                    servicer.FindMissingMessages,
                    request_deserializer=node_dot_v1_dot_node__pb2.FindMissingMessagesRequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.FindMissingMessagesResponse.SerializeToString,
            ),
            'SendObservationRequest': grpc.unary_unary_rpc_method_handler(
                    servicer.SendObservationRequest,
                    request_deserializer=node_dot_v1_dot_node__pb2.SendObservationRequestRequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.SendObservationRequestResponse.SerializeToString,
            ),
            'ChainGovernorStatus': grpc.unary_unary_rpc_method_handler(
                    servicer.ChainGovernorStatus,
                    request_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorStatusRequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.ChainGovernorStatusResponse.SerializeToString,
            ),
            'ChainGovernorReload': grpc.unary_unary_rpc_method_handler(
                    servicer.ChainGovernorReload,
                    request_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorReloadRequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.ChainGovernorReloadResponse.SerializeToString,
            ),
            'ChainGovernorDropPendingVAA': grpc.unary_unary_rpc_method_handler(
                    servicer.ChainGovernorDropPendingVAA,
                    request_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAARequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAAResponse.SerializeToString,
            ),
            'ChainGovernorReleasePendingVAA': grpc.unary_unary_rpc_method_handler(
                    servicer.ChainGovernorReleasePendingVAA,
                    request_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAARequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAAResponse.SerializeToString,
            ),
            'ChainGovernorResetReleaseTimer': grpc.unary_unary_rpc_method_handler(
                    servicer.ChainGovernorResetReleaseTimer,
                    request_deserializer=node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerRequest.FromString,
                    response_serializer=node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'node.v1.NodePrivilegedService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class NodePrivilegedService(object):
    """NodePrivilegedService exposes an administrative API. It runs on a UNIX socket and is authenticated
    using Linux filesystem permissions.
    """

    @staticmethod
    def InjectGovernanceVAA(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/InjectGovernanceVAA',
            node_dot_v1_dot_node__pb2.InjectGovernanceVAARequest.SerializeToString,
            node_dot_v1_dot_node__pb2.InjectGovernanceVAAResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def FindMissingMessages(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/FindMissingMessages',
            node_dot_v1_dot_node__pb2.FindMissingMessagesRequest.SerializeToString,
            node_dot_v1_dot_node__pb2.FindMissingMessagesResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def SendObservationRequest(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/SendObservationRequest',
            node_dot_v1_dot_node__pb2.SendObservationRequestRequest.SerializeToString,
            node_dot_v1_dot_node__pb2.SendObservationRequestResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ChainGovernorStatus(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/ChainGovernorStatus',
            node_dot_v1_dot_node__pb2.ChainGovernorStatusRequest.SerializeToString,
            node_dot_v1_dot_node__pb2.ChainGovernorStatusResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ChainGovernorReload(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/ChainGovernorReload',
            node_dot_v1_dot_node__pb2.ChainGovernorReloadRequest.SerializeToString,
            node_dot_v1_dot_node__pb2.ChainGovernorReloadResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ChainGovernorDropPendingVAA(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/ChainGovernorDropPendingVAA',
            node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAARequest.SerializeToString,
            node_dot_v1_dot_node__pb2.ChainGovernorDropPendingVAAResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ChainGovernorReleasePendingVAA(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/ChainGovernorReleasePendingVAA',
            node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAARequest.SerializeToString,
            node_dot_v1_dot_node__pb2.ChainGovernorReleasePendingVAAResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ChainGovernorResetReleaseTimer(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/node.v1.NodePrivilegedService/ChainGovernorResetReleaseTimer',
            node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerRequest.SerializeToString,
            node_dot_v1_dot_node__pb2.ChainGovernorResetReleaseTimerResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
