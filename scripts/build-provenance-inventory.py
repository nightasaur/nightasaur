#!/usr/bin/env python3
"""Generate an offline source inventory. Declarations are not legal approvals.

No network, model download, database access, or third-party content ingestion.
Run with --check to detect changes to dependency inputs and tracked assets.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data/compliance"

def normalized(path):
    # Normalize CRLF -> LF so Windows and Linux produce the same bytes
    return path.read_bytes().replace(b"\r\n", b"\n")

def digest(path):
    return hashlib.sha256(normalized(path)).hexdigest()

def snapshot():
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
    lock = json.loads((ROOT / "package-lock.json").read_text())
    packages = []
    for path, item in sorted(lock.get("packages", {}).items()):
        if not path or item.get("link") or "node_modules/" not in path:
            continue
        name = item.get("name") or path.rsplit("node_modules/", 1)[-1]
        packages.append({"ecosystem": "npm", "name": name, "version": item.get("version", "UNKNOWN"),
            "lockPath": path, "source": item.get("resolved"), "integrity": item.get("integrity"),
            "declaredLicense": item.get("license", "NOASSERTION"),
            "scope": "development" if item.get("dev") else "runtime-or-optional",
            "reviewStatus": "NOT_REVIEWED"})
    inputs = {"package-lock.json": digest(ROOT / "package-lock.json")}
    for name in sorted(set(tracked)):
        if not name or not Path(name).name.startswith("requirements") or not name.endswith(".txt"):
            continue
        file = ROOT / name
        inputs[name] = digest(file)
        for line in file.read_text().splitlines():
            match = re.fullmatch(r"([A-Za-z0-9_.-]+)(?:\[[^]]+\])?==([^\s;]+)", line.strip())
            if match:
                package, version = match.groups()
                packages.append({"ecosystem": "pypi", "name": package, "version": version,
                    "source": f"https://pypi.org/project/{package}/{version}/", "declaredIn": name,
                    "integrity": None, "declaredLicense": "NOASSERTION", "reviewStatus": "NOT_REVIEWED"})
    assets = []
    extensions = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp3", ".wav", ".mp4", ".woff", ".woff2", ".ttf", ".glb", ".gltf", ".obj", ".fbx"}
    for name in sorted(set(tracked)):
        if Path(name).suffix.lower() not in extensions:
            continue
        file = ROOT / name
        assets.append({"path": name, "sha256": digest(file), "bytes": len(normalized(file)),
            "source": "repository-file; original creator/source not independently verified",
            "license": "NOASSERTION", "reviewStatus": "SOURCE_AND_RIGHTS_REQUIRED",
            "distributionApproved": False})
    references = [
        ("text-runtime", None, "apps/ai-engine/config.py", "DISABLED_BY_DEFAULT"),
        ("image-checkpoint", None, "apps/ai-engine/services/comfyui.py", "DISABLED_BY_DEFAULT"),
        ("training-base", "runwayml/stable-diffusion-v1-5", "apps/ai-engine/training/train_lora.py", "SOURCE_AND_RIGHTS_REQUIRED"),
        ("vae", "vae-ft-mse-840000-ema-pruned.safetensors", "apps/ai-engine/workflows/spirit_generator.json", "SOURCE_AND_RIGHTS_REQUIRED"),
        ("lora", "nightasaur_style.safetensors", "apps/ai-engine/workflows/spirit_generator.json", "TRAINING_DATA_AND_RIGHTS_REQUIRED"),
    ]
    models = [{"kind": kind, "identifier": identifier, "referencedIn": path,
        "referenceSha256": digest(ROOT / path), "weightSha256": None,
        "license": "NOASSERTION", "reviewStatus": status, "commercialApproved": False}
        for kind, identifier, path, status in references]
    tools = [{"name": name, "source": url, "version": "UNPINNED", "license": "NOASSERTION", "reviewStatus": "NOT_REVIEWED"}
        for name, url in [("Ollama", "https://github.com/ollama/ollama"), ("ComfyUI", "https://github.com/comfyanonymous/ComfyUI"), ("PostgreSQL container (16-alpine; mutable tag)", "https://hub.docker.com/_/postgres"), ("Redis container (7-alpine; mutable tag)", "https://hub.docker.com/_/redis"), ("Node container (20-slim; mutable tag)", "https://hub.docker.com/_/node")]]
    common = {"schemaVersion": 1, "purpose": "PROVENANCE_ONLY_NOT_COMMERCIAL_CLEARANCE", "thirdPartyContentCopied": False}
    return {
        "packages.json": {**common, "sourceSha256": inputs, "coverage": "All npm lock entries and pinned direct Python declarations; Python transitive lock is still missing", "entries": packages},
        "models-assets.json": {**common, "models": models, "tools": tools, "assets": assets,
            "gaps": ["No model weight hashes or exact-version license evidence", "No original asset author/license evidence", "Training-data lineage missing", "OS/container packages and image digests require an image-level SBOM", "Generated user uploads and external runtime resources are not present in this repository and are not certified"]},
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(exist_ok=True, parents=True)
    mismatch = []
    results = snapshot()
    for name, data in results.items():
        content = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
        file = OUTPUT / name
        if args.check:
            if not file.exists() or file.read_text() != content:
                mismatch.append(name)
        else:
            file.write_text(content)
    if mismatch:
        raise SystemExit("Inventory stale: " + ", ".join(mismatch))
    print(json.dumps({"packages": len(results["packages.json"]["entries"]),
        "models": len(results["models-assets.json"]["models"]), "assets": len(results["models-assets.json"]["assets"]),
        "commercialApprovals": 0}))

if __name__ == "__main__":
    main()
