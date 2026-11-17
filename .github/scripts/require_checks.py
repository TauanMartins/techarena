"""Fail closed: allow skipped jobs only when the selector explicitly excludes them."""
import json
import os


def require_checks(needs):
    if needs['changes']['result'] != 'success':
        return False
    outputs = needs['changes']['outputs']
    if any(outputs.get(key) not in ('true', 'false') for key in ('frontend', 'backend')):
        return False
    any_component = any(outputs[key] == 'true' for key in ('frontend', 'backend'))
    return (needs['checks']['result'] == ('success' if any_component else 'skipped')
            and needs['integration']['result'] == ('success' if outputs['backend'] == 'true' else 'skipped')
            and needs['automation']['result'] == 'success')


if __name__ == '__main__':
    needs = json.loads(os.environ['CI_NEEDS'])
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('| Check | Result |\n|---|---|\n')
        for name, job in needs.items():
            summary.write(f"| {name} | {job['result']} |\n")
    if not require_checks(needs):
        raise SystemExit('Required CI checks did not pass or an unexpected job was skipped.')
