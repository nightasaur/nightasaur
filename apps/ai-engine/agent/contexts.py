# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Runtime context data structures - untrusted descriptive input only.

INVARIANTS:
- RuntimeContext is UNTRUSTED descriptive input
- No proof of identity, authorization, ownership, entitlement, or trust
- All values must be bounded and JSON-safe
- No credentials/secrets/auth material allowed
"""
from dataclasses import dataclass, field
from typing import Any, Optional, Union, Tuple


# Constants for bounded validation
MAX_STRING_LENGTH = 10000
MAX_CONTAINER_ITEMS = 100
MAX_NESTING_DEPTH = 10
MAX_PROVIDER_COUNT = 20  # Reasonable limit for ProviderContext

# Sensitive metadata keys that must be rejected
_SENSITIVE_KEY_PATTERNS = {
    "password", "passwd", "secret", "token", "api_key", "apikey",
    "credential", "credentials", "authorization", "auth", "private_key",
    "ssh_key", "key", "access_token", "refresh_token", "bearer",
    "client_secret", "client_id", "session_id", "cookie", "jwt",
}


def _reject_sensitive_metadata_keys(metadata: dict) -> None:
    """Recursively reject known sensitive metadata keys.
    
    Raises ValueError if any key matches a sensitive pattern.
    """
    def _normalize_key(key: str) -> str:
        """Normalize key for exact matching."""
        # Lowercase
        normalized = key.lower()
        # Normalize hyphens to underscores
        normalized = normalized.replace('-', '_')
        # Normalize spaces to underscores
        normalized = normalized.replace(' ', '_')
        return normalized
    
    def _check_dict(d: dict, path: str = "") -> None:
        for key, value in d.items():
            if not isinstance(key, str):
                continue
            
            normalized_key = _normalize_key(key)
            if normalized_key in _SENSITIVE_KEY_PATTERNS:
                raise ValueError(
                    f"Sensitive metadata key '{key}' detected at {path}"
                    if path else f"Sensitive metadata key '{key}' detected"
                )
            
            if isinstance(value, dict):
                new_path = f"{path}.{key}" if path else key
                _check_dict(value, new_path)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        new_path = f"{path}.{key}[{i}]" if path else f"{key}[{i}]"
                        _check_dict(item, new_path)
    
    if isinstance(metadata, dict):
        _check_dict(metadata)


def _validate_bounded_value(value: Any, depth: int = 0) -> None:
    """Validate that a value is bounded and JSON-safe.
    
    Raises ValueError if value exceeds bounds or contains unsupported types.
    """
    if depth > MAX_NESTING_DEPTH:
        raise ValueError(f"Nesting depth {depth} exceeds maximum {MAX_NESTING_DEPTH}")
    
    if value is None:
        return
    
    if isinstance(value, (str, int, float, bool)):
        if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
            raise ValueError(f"String length {len(value)} exceeds maximum {MAX_STRING_LENGTH}")
        return
    
    if isinstance(value, list):
        if len(value) > MAX_CONTAINER_ITEMS:
            raise ValueError(f"List length {len(value)} exceeds maximum {MAX_CONTAINER_ITEMS}")
        for item in value:
            _validate_bounded_value(item, depth + 1)
        return
    
    if isinstance(value, dict):
        if len(value) > MAX_CONTAINER_ITEMS:
            raise ValueError(f"Dict length {len(value)} exceeds maximum {MAX_CONTAINER_ITEMS}")
        for k, v in value.items():
            if not isinstance(k, str):
                raise ValueError(f"Dict key must be str, got {type(k).__name__}")
            if len(k) > MAX_STRING_LENGTH:
                raise ValueError(f"Dict key length {len(k)} exceeds maximum {MAX_STRING_LENGTH}")
            _validate_bounded_value(v, depth + 1)
        return
    
    raise ValueError(f"Unsupported type {type(value).__name__} for bounded value")


@dataclass(frozen=True)
class ProviderDescriptor:
    """Provider-neutral descriptor for a single provider."""
    kind: str  # e.g., "model", "memory", "tool", "compute", "service"
    provider_id: str  # Opaque identifier for this provider instance
    
    def __post_init__(self):
        """Validate ProviderDescriptor contract at runtime."""
        # Validate kind
        if not isinstance(self.kind, str):
            raise TypeError(f"kind must be str, got {type(self.kind).__name__}")
        if not self.kind:
            raise ValueError("kind must be non-empty")
        if len(self.kind) > MAX_STRING_LENGTH:
            raise ValueError(f"kind length {len(self.kind)} exceeds maximum {MAX_STRING_LENGTH}")
        
        # Validate provider_id
        if not isinstance(self.provider_id, str):
            raise TypeError(f"provider_id must be str, got {type(self.provider_id).__name__}")
        if not self.provider_id:
            raise ValueError("provider_id must be non-empty")
        if len(self.provider_id) > MAX_STRING_LENGTH:
            raise ValueError(f"provider_id length {len(self.provider_id)} exceeds maximum {MAX_STRING_LENGTH}")


@dataclass
class DeviceContext:
    """Descriptive device information - UNTRUSTED input."""
    device_id: str
    capabilities: "CapabilitySet" = field(default_factory=lambda: CapabilitySet())
    metadata: dict = field(default_factory=dict)  # JSON-safe only
    
    def __post_init__(self):
        """Validate bounded constraints."""
        if not isinstance(self.device_id, str):
            raise TypeError(f"device_id must be str, got {type(self.device_id).__name__}")
        if len(self.device_id) > MAX_STRING_LENGTH:
            raise ValueError(f"device_id length {len(self.device_id)} exceeds maximum {MAX_STRING_LENGTH}")
        
        if not isinstance(self.capabilities, CapabilitySet):
            raise TypeError(f"capabilities must be CapabilitySet, got {type(self.capabilities).__name__}")
        
        _validate_bounded_value(self.metadata)
        _reject_sensitive_metadata_keys(self.metadata)


@dataclass
class AgentIdentity:
    """Logical identifier only - NOT authenticated/persistent identity."""
    agent_id: str
    metadata: dict = field(default_factory=dict)  # JSON-safe only
    
    def __post_init__(self):
        """Validate bounded constraints."""
        if not isinstance(self.agent_id, str):
            raise TypeError(f"agent_id must be str, got {type(self.agent_id).__name__}")
        if len(self.agent_id) > MAX_STRING_LENGTH:
            raise ValueError(f"agent_id length {len(self.agent_id)} exceeds maximum {MAX_STRING_LENGTH}")
        _validate_bounded_value(self.metadata)
        _reject_sensitive_metadata_keys(self.metadata)


@dataclass
class ProviderContext:
    """Provider-neutral description of active providers."""
    providers: Tuple[ProviderDescriptor, ...] = ()
    metadata: dict = field(default_factory=dict)  # JSON-safe only
    
    def __post_init__(self):
        """Validate bounded constraints."""
        if not isinstance(self.providers, tuple):
            raise TypeError(f"providers must be tuple, got {type(self.providers).__name__}")
        
        if len(self.providers) > MAX_PROVIDER_COUNT:
            raise ValueError(f"Provider count {len(self.providers)} exceeds maximum {MAX_PROVIDER_COUNT}")
        
        for provider in self.providers:
            if not isinstance(provider, ProviderDescriptor):
                raise TypeError(f"All providers must be ProviderDescriptor, got {type(provider).__name__}")
        
        _validate_bounded_value(self.metadata)
        _reject_sensitive_metadata_keys(self.metadata)


@dataclass
class RuntimeContext:
    """Top-level runtime environment description - UNTRUSTED input."""
    runtime_id: str
    device: Optional[DeviceContext] = None
    agent: Optional[AgentIdentity] = None
    provider: Optional[ProviderContext] = None
    metadata: dict = field(default_factory=dict)  # JSON-safe only
    
    def __post_init__(self):
        """Validate bounded constraints."""
        if not isinstance(self.runtime_id, str):
            raise TypeError(f"runtime_id must be str, got {type(self.runtime_id).__name__}")
        if len(self.runtime_id) > MAX_STRING_LENGTH:
            raise ValueError(f"runtime_id length {len(self.runtime_id)} exceeds maximum {MAX_STRING_LENGTH}")
        
        if self.device is not None and not isinstance(self.device, DeviceContext):
            raise TypeError(f"device must be DeviceContext or None, got {type(self.device).__name__}")
        
        if self.agent is not None and not isinstance(self.agent, AgentIdentity):
            raise TypeError(f"agent must be AgentIdentity or None, got {type(self.agent).__name__}")
        
        if self.provider is not None and not isinstance(self.provider, ProviderContext):
            raise TypeError(f"provider must be ProviderContext or None, got {type(self.provider).__name__}")
        
        _validate_bounded_value(self.metadata)
        _reject_sensitive_metadata_keys(self.metadata)


# Import here to avoid circular import
from agent.capability import CapabilitySet