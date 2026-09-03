# Content administration backend

Private Django service for challenge drafts, immutable revisions, recommended-tree
releases and audit records. It is not part of the public learner path.

The first deployment uses Django's database-backed admin login at `/admin/` on
the existing hostname, restricted to the university VPN. Passwords are hashed by
Django and must never be placed in configuration. University SSO and a possible
separate admin hostname are later migrations.

## Development

```bash
python3 -m venv .venv
.venv/bin/pip install -r admin_backend/requirements.txt
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py migrate
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py createsuperuser
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py runserver 127.0.0.1:8001
```

## Checks

```bash
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py check
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py test curriculum
```

Production will use `/var/lib/uwc-hpc-admin/content.db` through
`DJANGO_DATABASE_PATH`, a root-owned `DJANGO_SECRET_KEY`, Gunicorn bound only to
loopback, and systemd. The planned custom editor presents an ordered list of
restricted-Typst, callout and Bash blocks with formatting controls and live
preview; see `../docs/content-blocks.md`. Publication generates sanitized static
HTML/JSON for Nginx, and recommended connections never gate learner access.
Publication and optimistic-concurrency work must be completed before Admins rely
on it.
