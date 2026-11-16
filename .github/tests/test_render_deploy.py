import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("render_deploy", Path(__file__).parents[1] / "scripts/render_deploy.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SHA = "a" * 40


class DeployTests(unittest.TestCase):
    def run_deploy(self, responses):
        calls = []
        def request(url, token=None, body=None):
            calls.append((url, token, body))
            return responses.pop(0)
        result = module.deploy("test-key", "srv-test", SHA, "https://example.test/",
                               request=request, sleep=lambda _: None, attempts=2)
        return result, calls

    def test_waits_for_exact_commit_and_health(self):
        result, calls = self.run_deploy([
            {"id": "dep-test"}, {"status": "build_in_progress"},
            {"status": "live", "commit": {"id": SHA}}, {"status": "ok", "database": "up"}])
        self.assertEqual(result, "dep-test")
        self.assertEqual(calls[0][2]["commitId"], SHA)
        self.assertEqual(calls[-1], ("https://example.test/health", None, None))

    def test_failure_does_not_check_old_healthy_deployment(self):
        with self.assertRaisesRegex(RuntimeError, "build_failed"):
            self.run_deploy([{"id": "dep-test"}, {"status": "build_failed"}])

    def test_wrong_commit_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "different commit"):
            self.run_deploy([{"id": "dep-test"}, {"status": "live", "commit": {"id": "b" * 40}}])

    def test_timeout(self):
        with self.assertRaises(TimeoutError):
            self.run_deploy([{"id": "dep-test"}, {"status": "queued"}, {"status": "queued"}])

    def test_unhealthy_database_fails(self):
        with self.assertRaisesRegex(RuntimeError, "health check failed"):
            self.run_deploy([{"id": "dep-test"}, {"status": "live", "commit": {"id": SHA}}] +
                            [{"status": "ok", "database": "down"}] * 12)


if __name__ == "__main__":
    unittest.main()
