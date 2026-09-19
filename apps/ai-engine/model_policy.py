# SPDX-License-Identifier: MIT
"""Model selection policy, independent of provider and framework imports.

This is a project prohibition, not a blanket license judgment. A non-blocked
identifier is NOT evidence of a commercial license or approved provenance.
"""
import hashlib
import unicodedata


# SHA-256 of the normalized four-character identifier prohibited by the
# project. Keeping the identifier itself out of source, fixtures, logs and
# generated notices prevents accidental reintroduction as a usable default.
_PROHIBITED_NGRAM_SHA256 = {
    "67f2d22514622d1be30c14ee9f3cb104503a159a33a656ca91a1953aa9616429",
}


def _contains_prohibited_identifier(selected: str) -> bool:
    folded = selected.casefold()
    return any(
        hashlib.sha256(folded[index:index + 4].encode("utf-8")).hexdigest()
        in _PROHIBITED_NGRAM_SHA256
        for index in range(max(0, len(folded) - 3))
    )


def validate_model_selection(model: str) -> str:
    """Normalize a configured identifier; empty means inference disabled."""
    selected = unicodedata.normalize("NFKC", model).strip()
    if _contains_prohibited_identifier(selected):
        raise ValueError("Model prohibited by Nightasaur policy; inference refused")
    return selected
