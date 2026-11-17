"""Validate the entire release before building or publishing either component."""
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit


def validate_deploy_config(env, root=Path('.')):
    errors = []
    if not re.fullmatch(r'[a-f0-9]{40}', env.get('RELEASE_SHA', '')):
        errors.append('RELEASE_SHA must be a full commit SHA')
    for component, required, urls in (
        ('backend', ('RENDER_API_KEY', 'RENDER_SERVICE_ID', 'BACKEND_URL'), ('BACKEND_URL',)),
        ('frontend', ('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'FRONTEND_URL',
                      'VITE_GOOGLE_MAPS_API_KEY', 'VITE_API_BASE_URL', 'VITE_SUPABASE_URL',
                      'VITE_SUPABASE_PUBLISHABLE_KEY'),
                     ('FRONTEND_URL', 'VITE_API_BASE_URL', 'VITE_SUPABASE_URL')),
    ):
        tag = env.get(f'{component.upper()}_TAG', '')
        if not tag:
            continue
        version = json.loads((root / component / 'package.json').read_text())['version']
        if tag != f'{component}-v{version}':
            errors.append(f'{component} release tag must match package.json')
        for name in required:
            if not env.get(name, '').strip():
                errors.append(f'{name} is required')
        for name in urls:
            try:
                url = urlsplit(env.get(name, ''))
                if (url.scheme != 'https' or not url.hostname or url.username or url.password
                        or url.query or url.fragment):
                    raise ValueError()
                _ = url.port
            except ValueError:
                errors.append(f'{name} must be an HTTPS URL without credentials, query or fragment')
        if component == 'backend' and not re.fullmatch(r'srv-[a-z0-9]+', env.get('RENDER_SERVICE_ID', '')):
            errors.append('RENDER_SERVICE_ID must be a Render service ID')
        if component == 'frontend' and not re.fullmatch(r'[a-fA-F0-9]{32}', env.get('CLOUDFLARE_ACCOUNT_ID', '')):
            errors.append('CLOUDFLARE_ACCOUNT_ID must be a 32-character account ID')
    if not (env.get('BACKEND_TAG') or env.get('FRONTEND_TAG')):
        errors.append('At least one component release is required')
    return errors


if __name__ == '__main__':
    errors = validate_deploy_config(os.environ)
    if errors:
        for error in errors:
            print(f'::error::{error}')  # Names only; never print configuration values.
        raise SystemExit(1)
    print('All selected components have valid deployment configuration.')
