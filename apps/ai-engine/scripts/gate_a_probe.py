# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Nightasaur3070 v0.4 Gate A read-only environment probe.

The probe performs no writes and does not start/stop services. It verifies
Windows, NVIDIA GPU visibility, Ollama health, and the requested model, then
prints a JSON report suitable for attaching to a PR review.
"""

from __future__ import annotations

import argparse
import json
import platform
import subprocess
import sys
from urllib.error import URLError
from urllib.request import urlopen


def _check_gpu() -> dict:
    command = [
        "nvidia-smi",
        "--query-gpu=name,memory.total,driver_version",
        "--format=csv,noheader,nounits",
    ]
    try:
        completed = subprocess.run(
            command, capture_output=True, text=True, timeout=10, check=False
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return {"ok": False, "error": type(exc).__name__}
    if completed.returncode != 0:
        return {"ok": False, "error": completed.stderr.strip()[:500]}
    rows = [row.strip() for row in completed.stdout.splitlines() if row.strip()]
    return {"ok": bool(rows), "gpus": rows}


def _check_ollama(base_url: str, model: str) -> dict:
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        with urlopen(url, timeout=5) as response:  # noqa: S310 - local URL is CLI input
            payload = json.load(response)
    except (OSError, URLError, ValueError) as exc:
        return {"ok": False, "error": type(exc).__name__, "url": url}
    models = [item.get("name", "") for item in payload.get("models", [])]
    return {
        "ok": model in models,
        "model": model,
        "available_models": models,
        "url": url,
    }


def build_report(base_url: str, model: str) -> dict:
    windows = platform.system() == "Windows"
    checks = {
        "windows_11": {
            "ok": windows and platform.release() == "11",
            "system": platform.system(),
            "release": platform.release(),
        },
        "nvidia_gpu": _check_gpu(),
        "ollama_model": _check_ollama(base_url, model),
    }
    return {
        "gate": "Nightasaur3070-v0.4-Gate-A",
        "mode": "read-only",
        "checks": checks,
        "verified": all(item["ok"] for item in checks.values()),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    parser.add_argument("--model", default="qwen2.5:3b")
    args = parser.parse_args()
    report = build_report(args.ollama_url, args.model)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["verified"] else 1


if __name__ == "__main__":
    sys.exit(main())
