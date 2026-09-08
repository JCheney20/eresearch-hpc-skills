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
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py bootstrap_content
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py createsuperuser
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py runserver 127.0.0.1:8001
```

## Checks

```bash
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py check
DJANGO_DEBUG=1 .venv/bin/python admin_backend/manage.py test curriculum
```

Open `/admin/curriculum-editor/` for the visual notebook and Cartesian graph
editor. Graph layouts are stored separately for each Topic and for Your Journey;
**Reset to automatic layout** regenerates positions from the recommended
connections. Draft saves use optimistic versions and reject stale browser tabs.

Production uses `/var/lib/uwc-hpc-admin/content.db` through
`DJANGO_DATABASE_PATH`, `/srv/uwc-hpc-content/content` through
`CONTENT_PUBLISH_ROOT`, a root-owned `DJANGO_SECRET_KEY`, Gunicorn bound only to
loopback, and systemd. Publishing writes immutable releases and atomically updates
`current.json`; Nginx serves that dynamic content while the committed release
remains the browser fallback. Existing code challenges remain developer-owned
until the declarative world and validator contract is implemented.

## Production activation

Install the service only after setting the paths and secret in
`deploy/systemd/uwc-hpc-admin.env.example`:

```bash
sudo install -d -m 0700 -o uwc-hpc-admin -g uwc-hpc-admin /var/lib/uwc-hpc-admin
sudo install -d -m 2750 -o uwc-hpc-admin -g www-data \
  /srv/uwc-hpc-content /srv/uwc-hpc-content/content /srv/uwc-hpc-content/admin-static
sudo -u uwc-hpc-admin /opt/uwc-hpc-admin/venv/bin/python admin_backend/manage.py migrate
sudo -u uwc-hpc-admin /opt/uwc-hpc-admin/venv/bin/python admin_backend/manage.py bootstrap_content
sudo -u uwc-hpc-admin /opt/uwc-hpc-admin/venv/bin/python admin_backend/manage.py collectstatic --noinput
sudo -u uwc-hpc-admin /opt/uwc-hpc-admin/venv/bin/python admin_backend/manage.py refresh_imported_markdown
sudo systemctl enable --now uwc-hpc-admin
sudo nginx -t && sudo systemctl reload nginx
```

`bootstrap_content` refuses to run once challenges exist. It preserves the
current learner release as passthrough content until an Admin deliberately edits
and republishes a challenge. `refresh_imported_markdown` safely updates existing
imported text drafts to the committed Markdown source; it leaves published
revisions unchanged.
