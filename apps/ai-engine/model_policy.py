# SPDX-License-Identifier: MIT
"""Model selection policy, independent of provider and framework imports.

This is a project prohibition, not a blanket license judgment. A non-blocked
identifier is NOT evidence of a commercial license or approved provenance.
"""
import unicodedata


def validate_model_selection(model: str) -> str:
    """Normalize a configured identifier; empty means inference disabled."""
    selected = unicodedata.normalize("NFKC", model).strip()
    if "qwen" in selected.casefold():
        raise ValueError("Model prohibited by Nightasaur policy; inference refused")
    return selected
