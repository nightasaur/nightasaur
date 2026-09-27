# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Context data structures tests."""
import json
import pytest

from agent.capability import Capability, CapabilitySet
from agent.contexts import (
    AgentIdentity,
    DeviceContext,
    ProviderContext,
    ProviderDescriptor,
    RuntimeContext,
    _validate_bounded_value,
    MAX_STRING_LENGTH,
    MAX_CONTAINER_ITEMS,
)


def test_validate_bounded_value():
    """Test bounded value validation."""
    # Valid values
    _validate_bounded_value("test")
    _validate_bounded_value(42)
    _validate_bounded_value(True)
    _validate_bounded_value(["a", "b"])
    _validate_bounded_value({"key": "value"})
    
    # String too long
    with pytest.raises(ValueError, match="exceeds maximum"):
        _validate_bounded_value("a" * (MAX_STRING_LENGTH + 1))
    
    # List too long
    with pytest.raises(ValueError, match="exceeds maximum"):
        _validate_bounded_value(list(range(MAX_CONTAINER_ITEMS + 1)))
    
    # Dict too many items
    with pytest.raises(ValueError, match="exceeds maximum"):
        _validate_bounded_value({str(i): i for i in range(MAX_CONTAINER_ITEMS + 1)})
    
    # Invalid type
    class CustomObject:
        pass
    
    with pytest.raises(ValueError, match="Unsupported type"):
        _validate_bounded_value(CustomObject())


def test_provider_descriptor():
    """Test ProviderDescriptor."""
    desc = ProviderDescriptor(kind="model", provider_id="ollama-1")
    assert desc.kind == "model"
    assert desc.provider_id == "ollama-1"


def test_device_context():
    """Test DeviceContext."""
    capabilities = CapabilitySet([
        Capability(name="has_camera", value=True),
    ])
    
    device = DeviceContext(
        device_id="device-123",
        capabilities=capabilities,
        metadata={"os": "linux"}
    )
    
    assert device.device_id == "device-123"
    assert device.capabilities.has("has_camera")


def test_agent_identity():
    """Test AgentIdentity."""
    identity = AgentIdentity(
        agent_id="agent-456",
        metadata={"role": "assistant"}
    )
    
    assert identity.agent_id == "agent-456"
    assert identity.metadata["role"] == "assistant"


def test_provider_context():
    """Test ProviderContext with multiple providers of same kind."""
    providers = (
        ProviderDescriptor(kind="model", provider_id="ollama-1"),
        ProviderDescriptor(kind="model", provider_id="ollama-2"),  # Same kind allowed
        ProviderDescriptor(kind="memory", provider_id="in-memory"),
    )
    
    context = ProviderContext(providers=providers)
    assert len(context.providers) == 3
    
    model_providers = [p for p in context.providers if p.kind == "model"]
    assert len(model_providers) == 2


def test_runtime_context():
    """Test RuntimeContext."""
    device = DeviceContext(device_id="device-123")
    agent = AgentIdentity(agent_id="agent-456")
    provider = ProviderContext(providers=(
        ProviderDescriptor(kind="model", provider_id="ollama-1"),
    ))
    
    runtime = RuntimeContext(
        runtime_id="runtime-789",
        device=device,
        agent=agent,
        provider=provider,
        metadata={"hostname": "server-1"}
    )
    
    assert runtime.runtime_id == "runtime-789"
    assert runtime.device is device
    assert runtime.agent is agent
    assert runtime.provider is provider


def test_runtime_context_partial():
    """Test RuntimeContext with partial information."""
    runtime = RuntimeContext(runtime_id="test")
    assert runtime.runtime_id == "test"
    assert runtime.device is None
    assert runtime.agent is None
    assert runtime.provider is None


def test_contexts_json_safe():
    """Test that contexts are JSON-serializable."""
    capabilities = CapabilitySet([
        Capability(name="has_camera", value=True),
    ])
    
    device = DeviceContext(
        device_id="laptop-001",
        capabilities=capabilities,
        metadata={"os": "linux"}
    )
    
    agent = AgentIdentity(
        agent_id="assistant-001",
        metadata={"role": "assistant"}
    )
    
    provider = ProviderContext(
        providers=(
            ProviderDescriptor(kind="model", provider_id="ollama-fixture"),
        ),
        metadata={"environment": "development"}
    )
    
    runtime = RuntimeContext(
        runtime_id="process-12345",
        device=device,
        agent=agent,
        provider=provider,
        metadata={"hostname": "dev-machine"}
    )
    
    # Should not raise
    json.dumps({
        "runtime_id": runtime.runtime_id,
        "device_id": device.device_id if device else None,
        "agent_id": agent.agent_id if agent else None,
        "provider_count": len(provider.providers) if provider else 0,
    })