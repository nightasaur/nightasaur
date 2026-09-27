import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class DeploymentContractTest(unittest.TestCase):
    def test_boot_only_starts_service(self):
        source = (ROOT / 'Dockerfile').read_text()
        commands = [line[4:] for line in source.splitlines() if line.startswith('CMD ')]
        self.assertEqual(len(commands), 1)
        self.assertEqual(json.loads(commands[0]), ['node', '--import', 'tsx', 'apps/backend/src/index.ts'])
        self.assertNotIn('--accept-data-loss', source)
        self.assertIn('RUN npm ci --ignore-scripts', source)

    def test_build_context_excludes_sensitive_inputs(self):
        patterns = set((ROOT / '.dockerignore').read_text().splitlines())
        self.assertTrue({'**/.env', '**/.env.*', '**/*.db', '**/uploads', '**/*.safetensors'}.issubset(patterns))
