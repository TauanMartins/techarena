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

    def run_script(self, current=None, protected=True):
        harness = r'''
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const calls = [];
const context = {repo: {owner: 'owner', repo: 'repo'}, payload: {pull_request: input.expected}};
const core = {info() {}, summary: {addRaw() { return this; }, async write() {}}};
const github = {
  rest: {pulls: {async get() {return {data: input.current};}}},
  async request() {return {data: input.protected ? [{type: 'required_status_checks',
    parameters: {required_status_checks: [{context: 'CI'}]}}] : []};},
  async graphql(query, variables) {calls.push({query, variables});}
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
            'protected': protected,
        }), text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_enables_protected_squash_merge(self):
        result = self.run_script()
        self.assertEqual(len(result['calls']), 1)
        self.assertEqual(result['calls'][0]['variables'], {'id': 'PR_8'})
        self.assertIn('mergeMethod: SQUASH', result['calls'][0]['query'])

    def test_does_not_merge_changed_or_ineligible_pr(self):
        changes = [
            ('state', 'closed'), ('draft', True), ('title', 'different title'),
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
