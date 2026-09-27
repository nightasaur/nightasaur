#!/usr/bin/env python3
"""Offline evidence for missing/unusual license declarations, not approval.
Run using the Python environment containing the pinned direct requirements.
Only package root or Python distribution license/notice files are inspected.
"""
import hashlib
import importlib.metadata as md
import json
from pathlib import Path
import re
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
COMMON = {'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'MIT-0', 'Unlicense', 'BlueOak-1.0.0'}

def license_file(path):
    return bool(re.match(r'^(licen[sc]e|copying|notice)([.\-_]|$)', path.name, re.I))

def main():
    source = ROOT / 'data/compliance/packages.json'
    inventory = json.loads(source.read_text())
    entries = []
    for item in inventory['entries']:
        if item['declaredLicense'] in COMMON:
            continue
        row = {key: item[key] for key in ('ecosystem', 'name', 'version', 'declaredLicense', 'source')}
        row['reviewStatus'] = 'NOT_APPROVED'
        files = []
        if item['ecosystem'] == 'npm':
            root = ROOT / item['lockPath']
            row['lockPath'] = item['lockPath']
            metadata = root / 'package.json'
            if not metadata.is_file():
                row['evidenceStatus'] = 'NOT_INSTALLED'
            else:
                package = json.loads(metadata.read_text())
                if package.get('version') != item['version']:
                    raise ValueError('Installed version does not match inventory: ' + item['name'])
                row['installedLicenseMetadata'] = package.get('license', package.get('licenses'))
                files = [(p.name, p) for p in sorted(root.iterdir()) if p.is_file() and license_file(p)]
        else:
            try:
                dist = md.distribution(item['name'])
            except md.PackageNotFoundError:
                row['evidenceStatus'] = 'NOT_INSTALLED'
            else:
                if dist.version != item['version']:
                    raise ValueError('Installed Python version mismatch: ' + item['name'])
                row['installedLicenseMetadata'] = dist.metadata.get('License-Expression') or dist.metadata.get('License')
                files = [(str(p), Path(dist.locate_file(p))) for p in sorted(dist.files or [])
                         if '.dist-info/' in str(p) and license_file(Path(p)) and Path(dist.locate_file(p)).is_file()]
        row['files'] = [{'path': name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'bytes': path.stat().st_size} for name, path in files]
        row.setdefault('evidenceStatus', 'LICENSE_FILE_FOUND' if files else 'NO_LICENSE_FILE')
        entries.append(row)
    result = {'scope': 'Missing or non-common declarations only; installed artifacts, not upstream authentication or legal clearance',
              'inventorySha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'summary': dict(Counter(row['evidenceStatus'] for row in entries)), 'entries': entries}
    out = ROOT / 'data/compliance/license-evidence.json'
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result['summary']))

if __name__ == '__main__':
    main()
