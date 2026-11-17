import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('validate_deploy_config',
    Path(__file__).parents[1] / 'scripts/validate_deploy_config.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DeployConfigTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for component in ('frontend', 'backend'):
            (self.root / component).mkdir()
            (self.root / component / 'package.json').write_text(json.dumps({'version': '1.2.3'}))
        self.env = {
            'RELEASE_SHA': 'a' * 40, 'BACKEND_TAG': 'backend-v1.2.3',
            'FRONTEND_TAG': 'frontend-v1.2.3', 'RENDER_API_KEY': 'secret-value',
            'RENDER_SERVICE_ID': 'srv-test', 'BACKEND_URL': 'https://api.example.test',
            'CLOUDFLARE_API_TOKEN': 'secret-value', 'CLOUDFLARE_ACCOUNT_ID': 'a' * 32,
            'FRONTEND_URL': 'https://example.test', 'VITE_GOOGLE_MAPS_API_KEY': 'secret-value',
            'VITE_API_BASE_URL': 'https://api.example.test/api',
            'VITE_SUPABASE_URL': 'https://project.supabase.co',
            'VITE_SUPABASE_PUBLISHABLE_KEY': 'public-value',
        }

    def test_accepts_complete_config(self):
        self.assertEqual(module.validate_deploy_config(self.env, self.root), [])

    def test_all_required_values_are_checked(self):
        for name in self.env.keys() - {'BACKEND_TAG', 'FRONTEND_TAG'}:
            with self.subTest(name=name):
                env = dict(self.env)
                del env[name]
                errors = module.validate_deploy_config(env, self.root)
                self.assertTrue(errors)
                self.assertNotIn('secret-value', str(errors))

    def test_unselected_component_needs_no_credentials(self):
        for component in ('backend', 'frontend'):
            env = dict(self.env)
            env[f'{component.upper()}_TAG'] = ''
            if component == 'backend':
                for name in ('RENDER_API_KEY', 'RENDER_SERVICE_ID', 'BACKEND_URL'):
                    del env[name]
            else:
                for name in list(env):
                    if name.startswith(('VITE_', 'CLOUDFLARE_')) or name == 'FRONTEND_URL':
                        del env[name]
            self.assertEqual(module.validate_deploy_config(env, self.root), [])

    def test_invalid_urls_and_tag_are_rejected(self):
        for url in ('http://api.example.test', 'https://user:password@example.test',
                    'https://example.test?token=sensitive', 'https://example.test:bad'):
            env = dict(self.env, BACKEND_URL=url)
            self.assertTrue(module.validate_deploy_config(env, self.root))
        env = dict(self.env, BACKEND_TAG='backend-v1.2.2')
        self.assertIn('backend release tag must match package.json', module.validate_deploy_config(env, self.root))
