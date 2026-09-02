# Content administration backend

Private Django service for challenge drafts, immutable revisions, curriculum
releases and audit records. It is not part of the public learner path.

Do not expose this service through Nginx until university SSO and the Admin-group
mapping are configured. Django's local login is for development only.

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
loopback, and systemd. Those deployment files are deferred until SSO details are
known.
