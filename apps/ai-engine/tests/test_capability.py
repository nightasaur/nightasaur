# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Capability and CapabilitySet tests."""
import json
import pytest

from agent.capability import Capability, CapabilitySet


def test_capability_creation():
    """Test basic Capability creation with various value types."""
    # Boolean capability
    cap1 = Capability(name="has_camera", value=True)
    assert cap1.name == "has_camera"
    assert cap1.value is True
    
    # Integer capability
    cap2 = Capability(name="gpu_memory_mb", value=8192)
    assert cap2.name == "gpu_memory_mb"
    assert cap2.value == 8192
    
    # String capability
    cap3 = Capability(name="device_type", value="laptop")
    assert cap3.name == "device_type"
    assert cap3.value == "laptop"
    
    # List capability
    cap4 = Capability(name="supported_resolutions", value=["1920x1080", "1280x720"])
    assert cap4.name == "supported_resolutions"
    assert cap4.value == ["1920x1080", "1280x720"]
    
    # Dict capability
    cap5 = Capability(name="device_info", value={"manufacturer": "Nightasaur", "model": "v1"})
    assert cap5.name == "device_info"
    assert cap5.value == {"manufacturer": "Nightasaur", "model": "v1"}
    
    # None capability
    cap6 = Capability(name="placeholder")
    assert cap6.name == "placeholder"
    assert cap6.value is None


def test_capability_metadata():
    """Test Capability metadata field."""
    cap = Capability(
        name="test",
        value=True,
        metadata={"description": "Test capability", "version": 1}
    )
    assert cap.metadata == {"description": "Test capability", "version": 1}


def test_capability_json_safe():
    """Test that Capability values are JSON-serializable."""
    test_cases = [
        Capability(name="bool", value=True),
        Capability(name="int", value=42),
        Capability(name="float", value=3.14),
        Capability(name="str", value="test"),
        Capability(name="list", value=[1, 2, 3]),
        Capability(name="dict", value={"a": 1, "b": 2}),
        Capability(name="nested", value={"list": [1, 2], "dict": {"x": "y"}}),
    ]
    
    for cap in test_cases:
        # Should not raise
        json.dumps({"name": cap.name, "value": cap.value, "metadata": cap.metadata})


def test_capability_set_creation():
    """Test CapabilitySet creation."""
    capabilities = [
        Capability(name="has_camera", value=True),
        Capability(name="has_microphone", value=True),
        Capability(name="gpu_memory_mb", value=8192),
    ]
    
    cap_set = CapabilitySet(capabilities=capabilities)
    assert len(cap_set.capabilities) == 3
    assert all(isinstance(c, Capability) for c in cap_set.capabilities)


def test_capability_set_empty():
    """Test empty CapabilitySet."""
    cap_set = CapabilitySet()
    assert len(cap_set.capabilities) == 0
    assert cap_set.capabilities == []


def test_capability_set_has():
    """Test CapabilitySet.has() method."""
    capabilities = [
        Capability(name="has_camera", value=True),
        Capability(name="has_microphone", value=False),
    ]
    
    cap_set = CapabilitySet(capabilities=capabilities)
    
    assert cap_set.has("has_camera") is True
    assert cap_set.has("has_microphone") is True
    assert cap_set.has("non_existent") is False


def test_capability_set_get():
    """Test CapabilitySet.get() method."""
    camera_cap = Capability(name="has_camera", value=True)
    mic_cap = Capability(name="has_microphone", value=False)
    
    capabilities = [camera_cap, mic_cap]
    cap_set = CapabilitySet(capabilities=capabilities)
    
    assert cap_set.get("has_camera") is camera_cap
    assert cap_set.get("has_microphone") is mic_cap
    assert cap_set.get("non_existent") is None


def test_capability_set_duplicate_names():
    """Test CapabilitySet with duplicate capability names."""
    cap1 = Capability(name="duplicate", value=1)
    cap2 = Capability(name="duplicate", value=2)  # Same name, different value
    
    cap_set = CapabilitySet(capabilities=[cap1, cap2])
    
    # .has() should return True for duplicate names
    assert cap_set.has("duplicate") is True
    
    # .get() returns first matching capability
    assert cap_set.get("duplicate") is cap1


def test_capability_set_default_factory():
    """Test CapabilitySet with default_factory."""
    cap_set = CapabilitySet()
    assert cap_set.capabilities == []
    
    # Should be mutable
    cap_set.capabilities.append(Capability(name="test", value=True))
    assert cap_set.has("test") is True