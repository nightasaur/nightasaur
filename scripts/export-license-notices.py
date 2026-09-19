#!/usr/bin/env python3
"""Export collected, hash-verified license evidence; not a complete release SBOM."""
import argparse
import hashlib
import importlib.metadata as md
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def render(root, evidence, locate_python):
    inventory = root / 'data/compliance/packages.json'
    if hashlib.sha256(inventory.read_bytes()).hexdigest() != evidence['inventorySha256']:
        raise ValueError('Inventory changed; regenerate and review evidence first')
    sections = ['# Collected third-party notices\n\n'
                'Partial evidence bundle, not release approval. Covers only entries in '
                'license-evidence.json; missing artifacts and other dependencies, models, '
                'assets and containers remain outside this bundle.\n']
    gaps = []
    count = 0
    for entry in evidence['entries']:
        label = f"{entry['name']} {entry['version']} ({entry['ecosystem']})"
        if entry['evidenceStatus'] != 'LICENSE_FILE_FOUND':
            gaps.append({'component': label, 'status': entry['evidenceStatus']})
            continue
        if not entry['files']:
            raise ValueError('Evidence claims files but contains none: ' + label)
        if entry['ecosystem'] == 'npm':
            base = (root / entry['lockPath']).resolve()
            base.relative_to(root.resolve())
            package = json.loads((base / 'package.json').read_text())
            if package['version'] != entry['version']:
                raise ValueError('Package version changed: ' + label)
            locate = lambda name: base / name
        elif entry['ecosystem'] == 'pypi':
            base, locate = locate_python(entry['name'], entry['version'])
        else:
            raise ValueError('Unsupported ecosystem')
        sections.append('\n## ' + label + '\n\nSource: ' + str(entry.get('source')) + '\n')
        for file in entry['files']:
            path = Path(locate(file['path'])).resolve()
            path.relative_to(base.resolve())
            data = path.read_bytes()
            if hashlib.sha256(data).hexdigest() != file['sha256'] or len(data) != file['bytes']:
                raise ValueError('License evidence changed: ' + label + '/' + file['path'])
            text = data.decode('utf-8')
            sections.append('\n--- BEGIN ' + file['path'] + ' ---\n' + text + '\n--- END ---\n')
            count += 1
    return '\n'.join(sections), {'scope': 'partial-collected-evidence', 'approved': False,
                                'licenseFiles': count, 'unresolved': gaps}


def locate_python(name, version):
    dist = md.distribution(name)
    if dist.version != version:
        raise ValueError('Python version changed: ' + name)
    return Path(dist.locate_file('')), dist.locate_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    evidence = json.loads((ROOT / 'data/compliance/license-evidence.json').read_text())
    # Validate every source before creating or replacing any output.
    notices, report = render(ROOT, evidence, locate_python)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'THIRD_PARTY_NOTICES.txt').write_text(notices, encoding='utf-8')
    (args.output_dir / 'NOTICE_COVERAGE.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
