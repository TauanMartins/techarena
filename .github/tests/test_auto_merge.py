"""Exercise the inline auto-merge script without credentials or network access."""
import copy
import json
import subprocess
import unittest
from pathlib import Path


class AutoMergeTests(unittest.TestCase):
    def setUp(self):
        workflow = (Path(__file__).parents[1] / 'workflows/ci.yml').read_text()
        script = workflow.split('      - name: Enable protected squash merge\n', 1)[1]
        self.script = '\n'.join(line[12:] for line in script.split('          script: |\n', 1)[1].splitlines())
        self.pr = {
            'number': 8, 'node_id': 'PR_8', 'state': 'open', 'draft': False,
            'title': 'ci: streamline automation', 'base': {'ref': 'main'},
            'user': {'login': 'owner'},
            'head': {'sha': 'approved', 'repo': {'full_name': 'owner/repo'}},
            'auto_merge': None,
        }

    def run_script(self, current=None, protected=True, graphql_error=None, merge_error=False):
        harness = r'''
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const calls = [];
const context = {repo: {owner: 'owner', repo: 'repo'}, payload: {pull_request: input.expected}};
const core = {info() {}, summary: {addRaw() { return this; }, async write() {}}};
const github = {
  rest: {pulls: {
    async get() {return {data: input.current};},
    async merge(args) {
      calls.push({merge: args});
      if (input.merge_error) throw new Error('Branch protections rejected merge');
      return {data: {merged: true}};
    }
  }},
  async request() {return {data: input.protected ? [{type: 'required_status_checks',
    parameters: {required_status_checks: input.protected === 'ci-only' ? [{context: 'CI'}] : [{context: 'CI'}, {context: 'Conventional PR title'}]}}] : []};},
  async graphql(query, variables) {
    if (input.graphql_error) {
      const error = new Error(input.graphql_error);
      error.errors = [{type: 'UNPROCESSABLE', message: input.graphql_error}];
      throw error;
    }
    calls.push({query, variables});
  }
};
(async () => {
  try {
    await new (Object.getPrototypeOf(async function(){}).constructor)(
      'github', 'context', 'core', input.script)(github, context, core);
    process.stdout.write(JSON.stringify({calls}));
  } catch (error) {process.stdout.write(JSON.stringify({calls, error: error.message}));}
})();
'''
        result = subprocess.run(['node', '-e', harness], input=json.dumps({
            'script': self.script, 'expected': self.pr,
            'current': current if current is not None else self.pr,
            'protected': protected, 'graphql_error': graphql_error, 'merge_error': merge_error,
        }), text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_enables_protected_squash_merge(self):
        result = self.run_script()
        self.assertEqual(len(result['calls']), 1)
        self.assertEqual(result['calls'][0]['variables'], {'id': 'PR_8'})
        self.assertIn('mergeMethod: SQUASH', result['calls'][0]['query'])

    def test_does_not_merge_changed_or_ineligible_pr(self):
        changes = [
            ('state', 'closed'), ('draft', True),
            ('base', {'ref': 'other'}), ('user', {'login': 'other'}),
            ('head', {'sha': 'new', 'repo': {'full_name': 'owner/repo'}}),
            ('head', {'sha': 'approved', 'repo': {'full_name': 'external/fork'}}),
            ('head', {'sha': 'approved', 'repo': None}),
        ]
        for field, value in changes:
            with self.subTest(field=field, value=value):
                current = copy.deepcopy(self.pr)
                current[field] = value
                self.assertEqual(self.run_script(current), {'calls': []})

    def test_does_not_enable_twice(self):
        current = copy.deepcopy(self.pr)
        current['auto_merge'] = {'enabled_by': {'login': 'owner'}}
        self.assertEqual(self.run_script(current), {'calls': []})

    def test_refuses_without_required_ci(self):
        result = self.run_script(protected=False)
        self.assertEqual(result['calls'], [])
        self.assertIn('Require CI', result['error'])

    def test_refuses_without_required_title_check(self):
        result = self.run_script(protected='ci-only')
        self.assertEqual(result['calls'], [])
        self.assertIn('Conventional PR title', result['error'])

    def test_title_edit_does_not_require_rebuilding(self):
        current = copy.deepcopy(self.pr)
        current['title'] = 'ci: corrected title'
        self.assertEqual(len(self.run_script(current)['calls']), 1)

    def test_unstable_falls_back_to_sha_bound_protected_merge(self):
        result = self.run_script(graphql_error='Pull request is in unstable status')
        merge = result['calls'][0]['merge']
        self.assertEqual(merge['sha'], 'approved')
        self.assertEqual(merge['merge_method'], 'squash')
        self.assertEqual(merge['pull_number'], 8)
        self.assertNotIn('error', result)

    def test_other_api_errors_do_not_attempt_merge(self):
        result = self.run_script(graphql_error='Resource not accessible')
        self.assertEqual(result['calls'], [])
        self.assertIn('Resource not accessible', result['error'])

    def test_unstable_fallback_does_not_ignore_branch_rejection(self):
        result = self.run_script(graphql_error='Pull request is in unstable status', merge_error=True)
        self.assertIn('Branch protections rejected', result['error'])
