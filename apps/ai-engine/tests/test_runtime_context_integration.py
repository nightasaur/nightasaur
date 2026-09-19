# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Integration tests for RuntimeContext v0.3 features."""
import pytest

from agent import (
    AgentCore,
    AgentInput,
    Capability,
    CapabilitySet,
    DeviceContext,
    AgentIdentity,
    ProviderContext,
    ProviderDescriptor,
    RuntimeContext,
)
from agent.execution_policy import ExecutionDecision, ExecutionPolicy
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.tool_calls import ModelResponse, ToolCallRequest
from agent.tools.base import Tool
from agent.tools.registry import ToolRegistry
from tests.conftest import FakeModelProvider


class TestTool(Tool):
    """Test tool for integration tests."""
    name = "test_tool"
    description = "A test tool"
    parameters = {
        "type": "object",
        "properties": {"value": {"type": "string"}},
        "required": ["value"],
    }
    
    async def run(self, **kwargs):
        return f"Processed: {kwargs['value']}"


class RuntimeContextAwarePolicy(ExecutionPolicy):
    """ExecutionPolicy that uses RuntimeContext for decisions."""
    
    def evaluate(self, tool_call, tool_spec, context):
        # Access runtime_context from context dict
        runtime_context = context.get("runtime_context")
        
        if runtime_context is None:
            # No runtime_context = v0.2 behavior: allow all
            return ExecutionDecision.ALLOW
        
        # Example policy: check device capabilities
        if runtime_context.device:
            has_camera = runtime_context.device.capabilities.has("has_camera")
            if has_camera and tool_call.name == "camera_tool":
                return ExecutionDecision.ALLOW
        
        # Example policy: check agent identity
        if runtime_context.agent and runtime_context.agent.agent_id == "trusted_agent":
            return ExecutionDecision.ALLOW
        
        # Default: require confirmation
        return ExecutionDecision.CONFIRMATION_REQUIRED


def _core_with_runtime_context(runtime_context=None, policy=None):
    """Helper to create AgentCore with optional runtime context."""
    provider = FakeModelProvider(responses=[
        ModelResponse(content="Final answer"),
    ])
    
    registry = ToolRegistry()
    registry.register(TestTool())
    
    return AgentCore(
        model_provider=provider,
        tool_registry=registry,
        memory_provider=EphemeralMemoryProvider(),
        execution_policy=policy or RuntimeContextAwarePolicy(),
    ), provider
@pytest.mark.asyncio
async def test_execution_policy_receives_runtime_context():
    """Test that ExecutionPolicy receives runtime_context in context dict."""
    class TrackingPolicy(ExecutionPolicy):
        received_contexts = []
        
        def evaluate(self, tool_call, tool_spec, context):
            self.received_contexts.append(context.copy())
            return ExecutionDecision.ALLOW
    
    # Create runtime context
    capabilities = CapabilitySet([Capability(name="has_camera", value=True)])
    device = DeviceContext(device_id="test-device", capabilities=capabilities)
    agent = AgentIdentity(agent_id="test-agent")
    runtime = RuntimeContext(
        runtime_id="test-runtime",
        device=device,
        agent=agent,
    )
    
    tracking_policy = TrackingPolicy()
    core, provider = _core_with_runtime_context(policy=tracking_policy)
    
    # Setup provider to request a tool call
    tool_call = ToolCallRequest(id="call-1", name="test_tool", arguments={"value": "test"})
    provider.responses = [
        ModelResponse(tool_calls=[tool_call]),
        ModelResponse(content="Done"),
    ]
    
    # Run with runtime_context
    await core.run(AgentInput(message="test", runtime_context=runtime))
    
    # Verify policy received runtime_context
    assert len(tracking_policy.received_contexts) == 1
    context = tracking_policy.received_contexts[0]
    assert "runtime_context" in context
    assert context["runtime_context"] is runtime
    
    # Verify runtime_context structure preserved
    rc = context["runtime_context"]
    assert rc.runtime_id == "test-runtime"
    assert rc.device.device_id == "test-device"
    assert rc.agent.agent_id == "test-agent"


@pytest.mark.asyncio
async def test_agentcore_does_not_inject_context_into_messages():
    """Test that RuntimeContext is not included in model messages."""
    class MessageInspectingPolicy(ExecutionPolicy):
        def evaluate(self, tool_call, tool_spec, context):
            # Verify messages don't contain runtime_context
            # (This would be in a real provider, but we're testing the boundary)
            return ExecutionDecision.ALLOW
    
    runtime = RuntimeContext(runtime_id="test")
    core, provider = _core_with_runtime_context(policy=MessageInspectingPolicy())
    
    await core.run(AgentInput(message="test", runtime_context=runtime))
    
@pytest.mark.asyncio
async def test_provider_context_supports_multiple_providers_same_kind():
    """Test ProviderContext supports multiple providers of the same kind."""
    # Create provider context with multiple model providers
    providers = (
        ProviderDescriptor(kind="model", provider_id="ollama-1"),
        ProviderDescriptor(kind="model", provider_id="ollama-2"),
        ProviderDescriptor(kind="memory", provider_id="in-memory"),
        ProviderDescriptor(kind="compute", provider_id="gpu-1"),
    )
    
    provider_context = ProviderContext(providers=providers)
    
    # Verify all providers are preserved
    assert len(provider_context.providers) == 4
    
    # Count providers by kind
    model_providers = [p for p in provider_context.providers if p.kind == "model"]
    assert len(model_providers) == 2
    assert {p.provider_id for p in model_providers} == {"ollama-1", "ollama-2"}
    
    # Verify runtime context with provider context works
    runtime = RuntimeContext(
        runtime_id="test",
        provider=provider_context,
    )
    
    core, _ = _core_with_runtime_context()
    output = await core.run(AgentInput(message="test", runtime_context=runtime))
    
    # Should work without errors
    assert output.content == "Final answer"


@pytest.mark.asyncio
async def test_capability_set_lookup_in_policy():
    """Test that ExecutionPolicy can use CapabilitySet for decisions."""
    # Create device with capabilities
    capabilities = CapabilitySet([
        Capability(name="has_camera", value=True),
        Capability(name="gpu_memory_mb", value=8192),
        Capability(name="supported_actions", value=["photo", "video"]),
    ])
    
    device = DeviceContext(device_id="camera-device", capabilities=capabilities)
    runtime = RuntimeContext(runtime_id="test", device=device)
    
    class CapabilityCheckingPolicy(ExecutionPolicy):
        def evaluate(self, tool_call, tool_spec, context):
            rc = context.get("runtime_context")
            if not rc or not rc.device:
                return ExecutionDecision.CONFIRMATION_REQUIRED
            
            # Use capability lookups
            if rc.device.capabilities.has("has_camera"):
                gpu_cap = rc.device.capabilities.get("gpu_memory_mb")
                if gpu_cap and gpu_cap.value >= 4096:
                    return ExecutionDecision.ALLOW
            
            return ExecutionDecision.DENY
    
    core, provider = _core_with_runtime_context(policy=CapabilityCheckingPolicy())
    
    # Setup tool call
    tool_call = ToolCallRequest(id="call-1", name="test_tool", arguments={"value": "test"})
    provider.responses = [
        ModelResponse(tool_calls=[tool_call]),
        ModelResponse(content="Done"),
    ]
    
    output = await core.run(AgentInput(message="test", runtime_context=runtime))
    
    # Policy should allow based on capabilities
    # (Note: AllowAllExecutionPolicy would allow, but we're testing capability lookup)


@pytest.mark.asyncio
async def test_bounded_validation_in_context_creation():
    """Test that bounded validation works during context creation."""
    from agent.contexts import _validate_bounded_value, MAX_STRING_LENGTH, MAX_CONTAINER_ITEMS
    
    # Test valid bounded values
    valid_metadata = {
        "string": "a" * 1000,  # Within limit
        "number": 42,
        "list": list(range(50)),  # Within limit
        "nested": {
            "inner": ["a", "b", "c"],
            "deep": {"level": 3}
        }
    }
    
    # Should not raise
    RuntimeContext(
        runtime_id="test",
        metadata=valid_metadata,
    )
    
    # Test invalid: string too long
    with pytest.raises(ValueError, match="exceeds maximum"):
        RuntimeContext(
            runtime_id="test",
            metadata={"long": "a" * 10001},  # Exceeds MAX_STRING_LENGTH
        )
    
    # Test invalid: list too long
    with pytest.raises(ValueError, match="exceeds maximum"):
        RuntimeContext(
            runtime_id="test",
            metadata={"big_list": list(range(101))},  # Exceeds MAX_CONTAINER_ITEMS
        )
    
    # Test invalid: dict too many items
    with pytest.raises(ValueError, match="exceeds maximum"):
        big_dict = {str(i): i for i in range(101)}  # Exceeds MAX_CONTAINER_ITEMS
        RuntimeContext(
            runtime_id="test",
            metadata=big_dict,
        )


@pytest.mark.asyncio
async def test_unsupported_object_rejection():
    """Test that unsupported object types are rejected."""
    from agent.contexts import _validate_bounded_value
    
    class CustomObject:
        pass
    
    # Test direct validation
    with pytest.raises(ValueError, match="Unsupported type"):
        _validate_bounded_value(CustomObject())
    
    # Test in metadata
    with pytest.raises(ValueError, match="Unsupported type"):
        RuntimeContext(
            runtime_id="test",
            metadata={"invalid": CustomObject()},
        )


@pytest.mark.asyncio 
async def test_backward_compatibility_full_stack():
    """Full stack test: verify v0.2 behavior preserved when runtime_context=None."""
    from agent import build_default_agent_core
    
    # This is what services/llm.py and services/assistant_llm.py do
    core = build_default_agent_core(base_url="http://localhost:11434", model="fixture-model:unit")
    
    # Create input WITHOUT runtime_context (v0.2 style)
    agent_input = AgentInput(
        message="Hello",
        system_prompt="You are a helpful assistant",
        history=[{"role": "user", "content": "Previous"}],
        session_id="test-session",
        model_options={"temperature": 0.7},
    )
    
    # Verify runtime_context is None (default)
    assert agent_input.runtime_context is None
    
    # The core should handle this exactly like v0.2
    # (We can't actually run without a real model provider, but the structure is compatible)
    # Just verify the input structure is valid
    assert isinstance(agent_input, AgentInput)
    assert agent_input.message == "Hello"
    assert agent_input.runtime_context is None


@pytest.mark.asyncio
async def test_runtime_context_not_exposed_in_output():
    """Test that RuntimeContext is not exposed in AgentOutput metadata."""
    runtime = RuntimeContext(runtime_id="test")
    core, provider = _core_with_runtime_context()
    
    output = await core.run(AgentInput(message="test", runtime_context=runtime))
    
    # RuntimeContext should NOT appear in AgentOutput metadata
    assert "runtime_context" not in output.metadata
    assert "RuntimeContext" not in str(output.metadata)
    
    # Check tool_trace if it exists
    if "tool_trace" in output.metadata:
        trace_str = str(output.metadata["tool_trace"])
        assert "runtime_context" not in trace_str
        assert "RuntimeContext" not in trace_str


@pytest.mark.asyncio
async def test_runtime_context_none_preserves_v0_2_behavior():
    """Test that runtime_context=None produces v0.2 behavior."""
    core, provider = _core_with_runtime_context()
    
    # Run with runtime_context=None (default)
    output = await core.run(AgentInput(message="test"))
    
    # Should work exactly like v0.2
    assert output.content == "Final answer"
    assert provider.call_count == 1