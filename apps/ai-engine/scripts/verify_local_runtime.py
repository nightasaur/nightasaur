# SPDX-License-Identifier: MIT
"""Real Ollama smoke test; never certifies the entire release Gate.

Creates only a disposable synthetic workspace. Does not install models, alter
services, or send project/user files to the model. Run from a clean checkout.
"""
from __future__ import annotations

import argparse
import asyncio
import contextlib
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
from urllib.request import urlopen

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from gate_a_probe import build_report
from model_policy import validate_model_selection

ROOT = Path(__file__).resolve().parents[3]
BASE_URL = "http://127.0.0.1:11434"


def normalize_digest(value):
    """Ollama tags may return a bare SHA-256 or an algorithm-prefixed value."""
    if not isinstance(value, str):
        raise ValueError("reviewed_ollama_digest_required")
    digest = value.removeprefix("sha256:")
    if not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise ValueError("reviewed_ollama_digest_required")
    return "sha256:" + digest


def git(*args):
    return subprocess.run(
        ["git", "-C", str(ROOT), *args], check=True, capture_output=True,
        text=True, timeout=15,
    ).stdout.strip()


def snapshot(root):
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError("unexpected_symlink")
        result[path.relative_to(root).as_posix()] = (
            hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "dir"
        )
    return result


def accepts(output, nonce):
    trace = output.metadata.get("tool_trace", [])
    reads = [t for t in trace if t.get("name") == "workspace_inspect"
             and t.get("ok") is True
             and t.get("arguments") == {"action": "read", "path": "challenge.txt"}]
    return bool(reads) and all(t.get("name") == "workspace_inspect"
                               and t.get("ok") is True for t in trace) and output.content.strip() == nonce


async def run(args):
    model = validate_model_selection(args.model)
    if not model or not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        raise ValueError("explicit_model_and_full_commit_required")
    reviewed_digest = normalize_digest(args.digest)
    if git("rev-parse", "HEAD") != args.commit or git("status", "--porcelain"):
        raise ValueError("checkout_must_match_candidate_and_be_clean")
    checks = build_report(BASE_URL, model)["checks"]
    checks["rtx_3070"] = {"ok": any(
        "RTX 3070" in gpu for gpu in checks["nvidia_gpu"].get("gpus", [])
    )}
    # Emit no installed-model inventory or private paths.
    checks["ollama_model"].pop("available_models", None)
    if not all(c["ok"] for c in checks.values()):
        return {"checks": checks, "runtime_verified": False}
    with urlopen(BASE_URL + "/api/tags", timeout=5) as response:
        tags = json.load(response)
    found = [m for m in tags.get("models", []) if m.get("name") == model]
    if len(found) != 1 or normalize_digest(found[0].get("digest")) != reviewed_digest:
        raise ValueError("model_digest_mismatch")
    from agent import AgentInput, build_read_only_agent_core
    with tempfile.TemporaryDirectory(prefix="nightasaur-runtime-") as directory:
        workspace = Path(directory)
        nonce = secrets.token_hex(16)
        (workspace / "challenge.txt").write_text(nonce, encoding="utf-8")
        before = snapshot(workspace)
        core = build_read_only_agent_core(BASE_URL, model, str(workspace))
        # Provider diagnostics must not corrupt JSON or reveal local responses.
        with contextlib.redirect_stdout(io.StringIO()):
            output = await asyncio.wait_for(core.run(AgentInput(
                message="Read challenge.txt using workspace_inspect action read. Return only its exact contents.",
                model_options={"temperature": 0, "num_predict": 256},
                max_tool_iterations=3,
            )), timeout=180)
        unchanged = before == snapshot(workspace)
        candidate_unchanged = git("rev-parse", "HEAD") == args.commit and not git("status", "--porcelain")
        return {"checks": checks, "model": model, "digest": reviewed_digest,
                "real_tool_result_reproduced": accepts(output, nonce),
                "fixture_unchanged": unchanged,
                "candidate_unchanged": candidate_unchanged,
                "runtime_verified": accepts(output, nonce) and unchanged and candidate_unchanged}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--digest", required=True, help="Digest from the reviewed model record")
    parser.add_argument("--commit", required=True)
    args = parser.parse_args()
    try:
        report = asyncio.run(run(args))
    except Exception as exc:
        report = {"runtime_verified": False, "error_type": type(exc).__name__}
    report.update(candidate=args.commit, generated_at=datetime.now(timezone.utc).isoformat(),
                  verified=False, scope="real_local_runtime_smoke",
                  remaining=["same_commit_ci", "model_provenance_review", "full_gate_review"])
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["runtime_verified"] else 1


if __name__ == "__main__":
    sys.exit(main())
