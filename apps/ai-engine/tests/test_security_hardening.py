# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Security hardening tests for RuntimeContext v0.3."""
import pytest

from agent.capability import Capability, CapabilitySet
from agent.contexts import (
    AgentIdentity,
    DeviceContext,
    ProviderContext,
    ProviderDescriptor,
    RuntimeContext,
    MAX_CONTAINER_ITEMS,
    MAX_STRING_LENGTH,
)
def test_capability_rejects_arbitrary_objects():
    """Test Capability rejects arbitrary objects in value."""
    class CustomObject:
        pass
    
    with pytest.raises(ValueError, match="Unsupported type"):
        Capability(name="test", value=CustomObject())


def test_capability_rejects_arbitrary_objects_in_metadata():
    """Test Capability rejects arbitrary objects in metadata."""
    class CustomObject:
        pass
    
    with pytest.raises(ValueError, match="Unsupported type"):
        Capability(name="test", metadata={"invalid": CustomObject()})


def test_capability_validates_name():
    """Test Capability validates name constraints."""
    # Empty name
    with pytest.raises(ValueError, match="non-empty"):
        Capability(name="")
    
    # Non-string name
    with pytest.raises(TypeError, match="must be str"):
        Capability(name=123)
    
def test_capability_set_rejects_non_capability_items():
    """Test CapabilitySet rejects non-Capability items."""
    with pytest.raises(TypeError, match="must be Capability"):
        CapabilitySet(capabilities=[{"name": "test", "value": True}])


def test_capability_set_enforces_item_limit():
    """Test CapabilitySet enforces MAX_CONTAINER_ITEMS."""
    capabilities = [Capability(name=f"cap{i}", value=i) for i in range(MAX_CONTAINER_ITEMS)]
    
    # Should work at limit
    CapabilitySet(capabilities=capabilities)
    
    # Should fail over limit
    capabilities.append(Capability(name="extra", value=True))
    with pytest.raises(ValueError, match="exceeds maximum"):
        CapabilitySet(capabilities=capabilities)


def test_capability_set_validates_capabilities_type():
    """Test CapabilitySet validates capabilities is a list."""
    with pytest.raises(TypeError, match="must be list"):
        CapabilitySet(capabilities=("not", "a", "list"))


def test_provider_descriptor_validates_kind():
    """Test ProviderDescriptor validates kind."""
    # Empty kind
    with pytest.raises(ValueError, match="non-empty"):
        ProviderDescriptor(kind="", provider_id="test")
    
    # Non-string kind
    with pytest.raises(TypeError, match="must be str"):
        ProviderDescriptor(kind=123, provider_id="test")
    
    # Too long kind
    with pytest.raises(ValueError, match="exceeds maximum"):
        ProviderDescriptor(kind="a" * (MAX_STRING_LENGTH + 1), provider_id="test")


def test_provider_context_enforces_provider_limit():
    """Test ProviderContext enforces provider count limit."""
    # Create many providers (more than MAX_PROVIDER_COUNT)
    providers = tuple(
        ProviderDescriptor(kind="model", provider_id=f"provider{i}")
        for i in range(25)  # More than MAX_PROVIDER_COUNT (20)
    )
    
    with pytest.raises(ValueError, match="exceeds maximum"):
        ProviderContext(providers=providers)


def test_provider_context_rejects_non_descriptor_items():
    """Test ProviderContext rejects non-ProviderDescriptor items."""
    with pytest.raises(TypeError, match="must be ProviderDescriptor"):
        ProviderContext(providers=("not-a-descriptor",))
def test_sensitive_metadata_keys_rejected():
    """Test sensitive metadata keys are rejected."""
    sensitive_cases = [
        {"password": "secret123"},
        {"api_key": "sk-12345"},
        {"access_token": "abc123"},
        {"credentials": {"username": "test", "password": "secret"}},
        {"auth": {"token": "xyz"}},
        {"nested": {"inner": {"private_key": "key"}}},
        {"list_with_secret": [{"token": "secret"}]},
    ]
    
    for metadata in sensitive_cases:
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            RuntimeContext(runtime_id="test", metadata=metadata)
        
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            DeviceContext(device_id="test", metadata=metadata)
        
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            AgentIdentity(agent_id="test", metadata=metadata)
        
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            ProviderContext(metadata=metadata)
        
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            Capability(name="test", metadata=metadata)


def test_sensitive_key_detection_case_insensitive():
    """Test sensitive key detection is case-insensitive."""
    case_variations = [
        {"Password": "secret"},  # Normalized to "password"
        {"API_KEY": "secret"},  # Normalized to "api_key"
        {"private_KEY": "secret"},  # Normalized to "private_key"
        {"AccessToken": "secret"},  # Normalized to "accesstoken" - NOT in sensitive list
    ]
    
    # First three should be rejected
    for metadata in case_variations[:3]:
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            RuntimeContext(runtime_id="test", metadata=metadata)
    
    # "AccessToken" normalized to "accesstoken" which is not in sensitive list
    # Should be accepted (no exception)
    RuntimeContext(runtime_id="test", metadata={"AccessToken": "secret"})


def test_exception_message_does_not_echo_secret_values():
    """Test exception messages don't echo secret values."""
    metadata = {"api_key": "super-secret-value-that-should-not-appear"}
    
    try:
        RuntimeContext(runtime_id="test", metadata=metadata)
        pytest.fail("Should have raised ValueError")
    except ValueError as e:
        error_msg = str(e)
        # Should mention the key but not the value
        assert "api_key" in error_msg
        assert "super-secret-value-that-should-not-appear" not in error_msg
def test_valid_nested_metadata_accepted():
    """Test valid nested JSON-safe metadata is accepted."""
    valid_metadata = {
        "info": {
            "version": "1.0",
            "features": ["camera", "microphone"],
            "config": {
                "resolution": "1080p",
                "framerate": 30,
            }
        },
        "tags": ["mobile", "android"],
        "count": 5,
        "active": True,
    }
    
    # Should not raise
    RuntimeContext(runtime_id="test", metadata=valid_metadata)
    DeviceContext(device_id="test", metadata=valid_metadata)
    AgentIdentity(agent_id="test", metadata=valid_metadata)
    ProviderContext(metadata=valid_metadata)
    Capability(name="test", metadata=valid_metadata)


def test_sensitive_key_normalized_exact_matching():
    """Test sensitive key detection uses normalized exact matching."""
    # Test exact matching after normalization
    sensitive_cases = [
        {"api_key": "secret"},  # Exact match
        {"API-KEY": "secret"},  # Normalized to api_key
        {"access token": "secret"},  # Normalized to access_token
        {"access-token": "secret"},  # Normalized to access_token
        {"ACCESS_TOKEN": "secret"},  # Normalized to access_token
        {"client-secret": "secret"},  # Normalized to client_secret
        {"private_key": "secret"},  # Exact match
        {"private-key": "secret"},  # Normalized to private_key
        {"refresh token": "secret"},  # Normalized to refresh_token
        {"ssh key": "secret"},  # Normalized to ssh_key
    ]
    
    for metadata in sensitive_cases:
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            RuntimeContext(runtime_id="test", metadata=metadata)
    
    # Test cases that should be rejected
    rejected_cases = [
        {"key": "value"},  # "key" is in sensitive list
    ]
    
    for metadata in rejected_cases:
        with pytest.raises(ValueError, match="Sensitive metadata key"):
            RuntimeContext(runtime_id="test", metadata=metadata)
    
    # Test legitimate keys that should be accepted (no false positives)
    legitimate_cases = [
        {"keyboard_layout": "qwerty"},
        {"monkey_mode": "enabled"},
        {"author": "John Doe"},
        {"authentication_supported": True},
        {"tokenize": "function"},  # Contains "token" but not exact match after normalization
        {"password_reset": "enabled"},  # Contains "password" but not exact match
        {"authorization_level": "admin"},  # Contains "authorization" but not exact match
        {"credential_manager": "ok"},  # Contains "credential" but not exact match
        {"AccessToken": "secret"},  # Normalized to "accesstoken", not in sensitive list
    ]
    
    # These should be accepted (no exception)
    for metadata in legitimate_cases:
        # Should not raise
        RuntimeContext(runtime_id="test", metadata=metadata)
def test_duplicate_provider_kinds_supported():
    """Test duplicate provider kinds remain supported."""
    providers = (
        ProviderDescriptor(kind="model", provider_id="ollama-1"),
        ProviderDescriptor(kind="model", provider_id="ollama-2"),
        ProviderDescriptor(kind="model", provider_id="ollama-3"),
        ProviderDescriptor(kind="memory", provider_id="in-memory"),
    )
    
    context = ProviderContext(providers=providers)
    assert len(context.providers) == 4
    
    model_providers = [p for p in context.providers if p.kind == "model"]
    assert len(model_providers) == 3


def test_capability_set_preserves_lookup_semantics():
    """Test CapabilitySet preserves has()/get() semantics after validation."""
    capabilities = [
        Capability(name="camera", value=True),
        Capability(name="microphone", value=True),
        Capability(name="gpu", value=8192),
    ]
    
    cap_set = CapabilitySet(capabilities=capabilities)
    
    # Test has()
    assert cap_set.has("camera") is True
    assert cap_set.has("microphone") is True
    assert cap_set.has("gpu") is True
    assert cap_set.has("nonexistent") is False
    
    # Test get()
    camera = cap_set.get("camera")
    assert camera is not None
    assert camera.name == "camera"
    assert camera.value is True
    
    assert cap_set.get("nonexistent") is None


def test_runtime_context_complete_object_graph_validation():
    """Test validation covers the entire object graph."""
    # Create a complete object graph
    capabilities = CapabilitySet([
        Capability(name="has_camera", value=True, metadata={"description": "Camera capability"}),
    ])
    
    device = DeviceContext(
        device_id="device-123",
        capabilities=capabilities,
        metadata={"os": "linux", "version": "1.0"}
    )
    
    agent = AgentIdentity(
        agent_id="agent-456",
        metadata={"role": "assistant", "created": "2026-01-01"}
    )
    
    provider = ProviderContext(
        providers=(
            ProviderDescriptor(kind="model", provider_id="ollama-1"),
            ProviderDescriptor(kind="memory", provider_id="in-memory"),
        ),
        metadata={"environment": "production"}
    )
    
    runtime = RuntimeContext(
        runtime_id="runtime-789",
        device=device,
        agent=agent,
        provider=provider,
        metadata={"hostname": "server-1", "region": "us-east"}
    )
    
    # Should not raise
    assert runtime.runtime_id == "runtime-789"
    assert runtime.device is device
    assert runtime.agent is agent
    assert runtime.provider is provider
def test_provider_descriptor_validates_provider_id():
    """Test ProviderDescriptor validates provider_id."""
    # Empty provider_id
    with pytest.raises(ValueError, match="non-empty"):
        ProviderDescriptor(kind="model", provider_id="")
    
    # Non-string provider_id
    with pytest.raises(TypeError, match="must be str"):
        ProviderDescriptor(kind="model", provider_id=456)
    
    # Too long provider_id
    with pytest.raises(ValueError, match="exceeds maximum"):
        ProviderDescriptor(kind="model", provider_id="a" * (MAX_STRING_LENGTH + 1))
    # Too long name
    with pytest.raises(ValueError, match="exceeds maximum"):
        Capability(name="a" * (MAX_STRING_LENGTH + 1))