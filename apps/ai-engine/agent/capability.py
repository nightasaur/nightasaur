# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Capability and CapabilitySet - declarative capability descriptions.

Capability is a declarative statement of what a device/tool/provider can do.
CapabilitySet is a first-class collection of capabilities with lookup semantics.

INVARIANTS:
- Capability != Permission
- Capability != Authorization  
- Capability != Trust Assertion
- Capability values are bounded, JSON-safe descriptive values only
- No hardware handles, connections, credentials, or executable objects
"""
from dataclasses import dataclass, field
from typing import Any, Optional, Union


@dataclass(frozen=True)
class Capability:
    """Declarative statement of what a device/tool/provider can do.
    
    Values must be bounded and JSON-safe: str, int, float, bool, None,
    or lists/dicts containing only these types.
    
    Examples:
        Capability(name="has_camera", value=True)
        Capability(name="gpu_memory_mb", value=8192)
        Capability(name="supported_resolutions", value=["1920x1080", "1280x720"])
    """
    name: str
    value: Union[str, int, float, bool, list, dict, None] = None
    metadata: dict = field(default_factory=dict)  # JSON-safe only
    
    def __post_init__(self):
        """Validate Capability contract at runtime."""
        # Import validation functions here to avoid circular import
        from agent.contexts import (
            MAX_STRING_LENGTH,
            _validate_bounded_value,
            _reject_sensitive_metadata_keys,
        )
        
        # Validate name
        if not isinstance(self.name, str):
            raise TypeError(f"name must be str, got {type(self.name).__name__}")
        if not self.name:
            raise ValueError("name must be non-empty")
        if len(self.name) > MAX_STRING_LENGTH:
            raise ValueError(f"name length {len(self.name)} exceeds maximum {MAX_STRING_LENGTH}")
        
        # Validate value
        _validate_bounded_value(self.value)
        
        # Validate metadata
        _validate_bounded_value(self.metadata)
        _reject_sensitive_metadata_keys(self.metadata)


@dataclass
class CapabilitySet:
    """First-class collection of capabilities with lookup semantics."""
    capabilities: list = field(default_factory=list)
    
    def __post_init__(self):
        """Validate CapabilitySet contract at runtime."""
        # Import validation functions here to avoid circular import
        from agent.contexts import MAX_CONTAINER_ITEMS
        
        if not isinstance(self.capabilities, list):
            raise TypeError(f"capabilities must be list, got {type(self.capabilities).__name__}")
        
        if len(self.capabilities) > MAX_CONTAINER_ITEMS:
            raise ValueError(f"CapabilitySet length {len(self.capabilities)} exceeds maximum {MAX_CONTAINER_ITEMS}")
        
        for i, item in enumerate(self.capabilities):
            if not isinstance(item, Capability):
                raise TypeError(f"CapabilitySet item at index {i} must be Capability, got {type(item).__name__}")
    
    def has(self, name: str) -> bool:
        """Check if capability exists by name."""
        return any(c.name == name for c in self.capabilities)
    
    def get(self, name: str) -> Optional[Capability]:
        """Get capability by name, returns None if not found."""
        for cap in self.capabilities:
            if cap.name == name:
                return cap
        return None