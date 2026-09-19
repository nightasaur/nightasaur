import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('notices', Path(__file__).parents[1] / 'export-license-notices.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class NoticesTest(unittest.TestCase):
    def test_preserves_text_and_rejects_tampering_and_escape(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            inventory = root / 'data/compliance/packages.json'
            inventory.parent.mkdir(parents=True)
            inventory.write_bytes(b'{}')
            package = root / 'node_modules/fixture'
            package.mkdir(parents=True)
            (package / 'package.json').write_text(json.dumps({'version': '1.0'}))
            text = 'Copyright fixture\nPermission notice retained verbatim.\n'
            license = package / 'LICENSE'
            license.write_text(text)
            entry = {'name': 'fixture', 'version': '1.0', 'ecosystem': 'npm',
                     'lockPath': 'node_modules/fixture', 'evidenceStatus': 'LICENSE_FILE_FOUND',
                     'files': [{'path': 'LICENSE', 'bytes': len(text.encode()),
                                'sha256': hashlib.sha256(text.encode()).hexdigest()}]}
            evidence = {'inventorySha256': hashlib.sha256(b'{}').hexdigest(), 'entries': [entry]}
            output, report = module.render(root, evidence, None)
            self.assertIn(text, output)
            self.assertEqual(report['licenseFiles'], 1)
            self.assertFalse(report['approved'])
            license.write_text('altered')
            with self.assertRaisesRegex(ValueError, 'evidence changed'):
                module.render(root, evidence, None)
            entry['files'][0]['path'] = '../outside'
            with self.assertRaises(ValueError):
                module.render(root, evidence, None)
            entry['evidenceStatus'] = 'NOT_INSTALLED'
            _, report = module.render(root, evidence, None)
            self.assertEqual(len(report['unresolved']), 1)
            inventory.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError, 'Inventory changed'):
                module.render(root, evidence, None)


if __name__ == '__main__':
    unittest.main()
