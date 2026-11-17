"""Select PR checks conservatively; every main commit gets the full suite."""
import json
import os
import re
import subprocess
from pathlib import Path


def select_checks(paths, full=False):
    selected = set(('frontend', 'backend')) if full else set()
    for path in paths:
        component = path.split('/', 1)[0]
        if component in ('frontend', 'backend'):
            selected.add(component)
        elif path.startswith('docs/') or path in ('README.md', 'LICENSE', 'LICENSE.md'):
            continue
        else:
            # Unknown/shared files, automation, migrations and root configs run both.
            selected.update(('frontend', 'backend'))
    return {
        'frontend': 'true' if 'frontend' in selected else 'false',
        'backend': 'true' if 'backend' in selected else 'false',
        'matrix': {'include': [
            {'component': component, 'test-command': command}
            for component, command in [('frontend', 'npm run test:coverage'),
                                       ('backend', 'npm run test:cov')]
            if component in selected
        ]},
    }


if __name__ == '__main__':
    is_pr = os.environ['GITHUB_EVENT_NAME'] == 'pull_request'
    paths = []
    if is_pr:
        pr = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())['pull_request']
        base, head = pr['base']['sha'], pr['head']['sha']
        if not all(re.fullmatch(r'[a-f0-9]{40}', sha) for sha in (base, head)):
            raise ValueError('Invalid PR commit SHA')
        # --no-renames reports both paths for moves across component boundaries.
        result = subprocess.run(['git', 'diff', '--name-only', '--no-renames', '-z',
                                 f'{base}...{head}', '--'], check=True, capture_output=True)
        paths = result.stdout.decode().rstrip('\0').split('\0') if result.stdout else []
    selected = select_checks(paths, full=not is_pr)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for key, value in selected.items():
            output.write(f'{key}={json.dumps(value) if isinstance(value, dict) else value}\n')
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write(f"Checks selected: frontend={selected['frontend']}, backend={selected['backend']}. "
                      'Main/manual runs always validate both components.\n')
