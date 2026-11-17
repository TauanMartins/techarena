import copy
import importlib.util
from pathlib import Path
import unittest

SCRIPTS = Path(__file__).parents[1] / 'scripts'


def load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CiSelectionTests(unittest.TestCase):
    def test_frontend_only(self):
        selected = load('select_checks').select_checks(['frontend/src/App.tsx'])
        self.assertEqual(selected['frontend'], 'true')
        self.assertEqual(selected['backend'], 'false')
        self.assertEqual(len(selected['matrix']['include']), 1)

    def test_backend_only(self):
        selected = load('select_checks').select_checks(['backend/package-lock.json'])
        self.assertEqual(selected['frontend'], 'false')
        self.assertEqual(selected['backend'], 'true')

    def test_shared_unknown_files_and_main_run_both(self):
        for paths, full in [(['.github/workflows/ci.yml'], False),
                            (['supabase/migration.sql'], False), (['new-root-file'], False),
                            (['docs/guide.md'], True), ([], True),
                            (['frontend/old.ts', 'backend/new.ts'], False)]:
            with self.subTest(paths=paths, full=full):
                selected = load('select_checks').select_checks(paths, full)
                self.assertEqual(selected['frontend'], 'true')
                self.assertEqual(selected['backend'], 'true')

    def test_docs_do_not_run_application_tests(self):
        selected = load('select_checks').select_checks(['docs/guide.md', 'README.md'])
        self.assertEqual(selected['frontend'], 'false')
        self.assertEqual(selected['backend'], 'false')

    def test_gate_accepts_only_expected_skips(self):
        require = load('require_checks').require_checks
        needs = {
            'changes': {'result': 'success', 'outputs': {'frontend': 'true', 'backend': 'false'}},
            'checks': {'result': 'success'}, 'integration': {'result': 'skipped'},
            'automation': {'result': 'success'},
        }
        self.assertTrue(require(needs))
        for job in ('checks', 'automation', 'changes'):
            for status in ('failure', 'cancelled', 'skipped'):
                changed = copy.deepcopy(needs)
                changed[job]['result'] = status
                self.assertFalse(require(changed))
        needs['changes']['outputs']['backend'] = 'true'
        self.assertFalse(require(needs))
        needs['integration']['result'] = 'success'
        self.assertTrue(require(needs))
        needs['changes']['outputs']['frontend'] = ''
        self.assertFalse(require(needs))

    def test_docs_still_require_automation(self):
        require = load('require_checks').require_checks
        needs = {
            'changes': {'result': 'success', 'outputs': {'frontend': 'false', 'backend': 'false'}},
            'checks': {'result': 'skipped'}, 'integration': {'result': 'skipped'},
            'automation': {'result': 'success'},
        }
        self.assertTrue(require(needs))
        needs['automation']['result'] = 'failure'
        self.assertFalse(require(needs))
