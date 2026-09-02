# UWC HPC deployment and content-administration plan

## Scope and decisions

This plan covers the current static trainer, its future authenticated content-administration service, and a platform load balancer that terminates TLS. It deliberately excludes a real web terminal connected to HPC nodes; that is a separate future service requiring its own security review and HPC approval.

| Area | Decision |
|---|---|
| Current hosting | Ubuntu Nginx package, supervised by its existing systemd service. No Docker/Compose. |
| Public site | Static, anonymous, and served by Nginx. |
| Admin site | Separate `admin.<domain>` hostname, university-VPN restricted, university SSO protected. |
| Admin role | One `Admin` role may draft and publish. |
| Content source | SQLite on the VM; it generates immutable static learner content. |
| Published content | Static content releases, served by Nginx rather than queried from SQLite. |
| TLS | Future platform load balancer terminates TLS and forwards HTTP to Nginx. |
| Real terminal | Out of scope; never place HPC credentials or a terminal proxy on this public-content VM. |

## Phase 1: serve the present static site

The repository is static HTML, JavaScript, CSS, fonts, and vendored browser assets. Run the Ubuntu Nginx package directly; `nginx.service` already gives reboot startup and process supervision.

### Target layout

```text
/srv/uwc-hpc-skills/
  releases/<immutable-code-release>/  # root-owned static application copy
  current -> releases/<release>       # Nginx document root; enables rollback
/etc/nginx/sites-available/uwc-hpc-skills
/etc/nginx/sites-enabled/uwc-hpc-skills
```

Deploy `index.html`, `legacy.html`, `css/`, `js/`, `vendor/`, fonts, and other static assets to a new root-owned release directory. Nginx workers must not be able to modify it.

```nginx
server {
    listen 80;
    server_name training.example.edu;

    root /srv/uwc-hpc-skills/current;
    index index.html;

    location = /healthz { access_log off; return 204; }
    location / { try_files $uri $uri/ =404; }
}
```

The installable repository copy is `deploy/nginx/uwc-hpc-skills.conf`; it uses `server_name _` until DNS is known. Keep Nginx HTTP-only until the platform load balancer is available.

### Deployment procedure

1. Run `node tools/check.mjs` in the repository.
2. Copy deployable static assets into a new release directory.
3. Point `current` to that release.
4. Install `deploy/nginx/uwc-hpc-skills.conf` as `/etc/nginx/sites-available/uwc-hpc-skills`, enable its symlink in `sites-enabled`, and remove the packaged `sites-enabled/default` symlink because this configuration owns the default listener.
5. Run `sudo nginx -t`; reload only if it succeeds.
6. Validate `curl -I http://127.0.0.1/`, `curl -i http://127.0.0.1/healthz`, `index.html`, and `legacy.html`.
7. Retain the preceding release until validation succeeds. Roll back by repointing `current` and reloading Nginx.

Enable the existing service once:

```bash
sudo systemctl enable --now nginx
```

Do not modify `/lib/systemd/system/nginx.service`.

## Phase 2: content and curriculum model

Stable challenge identities, topics, and explicit prerequisite groups now live in `js/track/content.js`; topic order no longer creates dependencies. Challenge prose and worlds remain JavaScript compatibility modules and require a deliberate migration before they become admin-editable. The simulated-shell engine, command implementations, schema, and validators remain developer-owned Git code.

### Authorable content

Admins may author:

- topics: name, blurb, order, and each challenge's single topic membership;
- reading and interactive challenges;
- prose, worked examples, hint ladders, answers, failure messages, variants, worlds, canned output, and allowed declarative command hooks;
- explicit challenge-graph prerequisite groups; and
- drafts and publications.

All prose uses a restricted, safely rendered Markdown subset. Do not accept arbitrary HTML. Worlds use a limited declarative schema—filesystem data, canned output, variables, and allowed hooks—not arbitrary server-side JavaScript.

### Challenge identity and revisions

A challenge revision ID is six hexadecimal digits:

```text
CCCRRR
```

- `CCC` is the stable three-hex-digit challenge number.
- `RRR` is the three-hex-digit published revision number.
- `00F001` means challenge `00F` (decimal 15), revision `001`.

Challenge number `000` represents the present reading challenge 0. The current nineteen challenges migrate once to `000001` through `012001`. Challenge numbers are allocated monotonically and never reused, including after archival.

Draft saves are mutable and do not consume revision numbers. Successful publication creates new revision numbers only for challenges whose authored content/world changed.

### Content releases and graph

A **content release** is an immutable, atomically published set of changed challenge revisions plus one validated challenge graph. A graph-only edit creates a new content release, not new challenge revisions.

The challenge graph is a directed acyclic graph of explicit prerequisite groups. Every group must be satisfied:

- an **all-of** group requires all its source challenges;
- an **any-of** group requires one or more source challenges.

This represents, for example, completion of `D`, `E`, and one of `{A, B, C}`. Topics are presentation groups only and no longer derive prerequisites.

Publication is blocked unless the candidate release validates all schema rules, challenge worlds, answers, worked examples, graph references, acyclicity, and learner rendering. The Admin also gets a learner-equivalent preview before publishing.

## Phase 3: learner progress and revision policy

Public learners remain anonymous initially. Browser-local progress records only challenge number, revision, chosen variant, started/completed state, and timestamps; it must not retain terminal commands or wrong answers.

### Attempts

- Merely viewing a challenge does not start it.
- Reveal-hint, terminal-command, or answer-submission starts an attempt and pins its challenge revision and variant.
- Resetting an attempt clears terminal/hint state but stays on the same revision.
- A learner may explicitly abandon an attempt and confirm a start on the newest revision; the system never switches them automatically.
- A completed revision satisfies any current prerequisite for the same challenge number. A fundamentally new curricular requirement must use a new challenge number.

### Retention

Keep the newest ten revisions of every challenge. Only the newest five are eligible for unfinished learner attempts.

If an unfinished attempt falls out of the five-revision eligibility window, show a clear restart screen and require confirmation before beginning the newest revision. Completed history remains recorded. An archived challenge is unavailable to new learners but retains its ten newest revisions and eligible started attempts; delete older revisions.

The first migration preserves present browser-local completions by mapping existing challenge numbers to their initial `...001` revisions. Started-at-revision state is new.

When learner SSO is introduced later, offer a one-time confirmed import of browser-local progress into the account. The account then becomes the cross-device progress record.

## Phase 4: admin backend and publication pipeline

The private Django scaffold in `admin_backend/` now defines drafts, immutable challenge revisions, curriculum drafts, content releases, release membership, and audit records. It remains undeployed: university SSO, optimistic-concurrency forms, publication validation/static generation, and export are still required before Nginx may expose it.

### Service boundary

- Run one backend as a dedicated non-root `uwc-hpc-admin` account.
- Bind it only to `127.0.0.1:<port>` or a Unix socket.
- Reverse proxy it through Nginx at `admin.<domain>`; never expose its backend port through VPC ACLs, security groups, or the load balancer.
- Use a systemd unit with `Restart=on-failure`, `RestartSec=5s`, `WantedBy=multi-user.target`, and a root-readable environment file for secrets.
- Use university OIDC/SAML, MFA, server-side authorization, secure HttpOnly cookies, CSRF protection, login rate limiting, and deny-by-default authorization.

Use optimistic concurrency: a save based on an old draft version is rejected and the Admin must reload/reconcile. Do not build live collaborative editing.

### State and audit

SQLite is appropriate for this single VM and low-volume authoring. Keep it outside Nginx and all release roots:

```text
/var/lib/uwc-hpc-admin/content.db
/etc/uwc-hpc-admin.env              # root-owned, mode 0600
```

Use WAL mode, short transactions, and one writer at a time. Every draft save and publication writes an immutable audit record: author, time, changed fields, and prior revision. Rollback publishes a new content release that selects retained older revisions; it never rewrites history.

### Static publication

After validation and preview, publishing generates immutable static learner assets: a current content manifest and static files for retained challenge revisions. Nginx serves these assets; browsers do not query SQLite. This keeps the public learner path static and lets a browser reload a pinned revision.

Admin-authored content publications do not require a Git deployment. Engine/schema changes still require normal reviewed Git deployments.

## Phase 5: recovery and backup

After every successful publication, generate a JSON **content export** containing:

- published content releases and retained revisions;
- drafts;
- the challenge graph; and
- audit records.

Never include authentication secrets. Until university-managed backup is available, an administrator manually pulls each post-publish export from the VM with SSH/SCP to a separate trusted location. Keeping that export only on the VM is useful for mistake recovery but is not VM-loss recovery.

Later, replace the manual process with off-VM university-managed storage, scheduled SQLite-aware backups, retention, and restore tests. Do not back up a live WAL database by copying only `content.db`; use SQLite's backup API or another SQLite-aware process.

## Phase 6: platform load balancer and TLS

After the platform certificate and load balancer exist:

1. Terminate TLS at the load balancer.
2. Forward HTTP to Nginx on VM port 80 and health-check `/healthz`.
3. Restrict VM port 80 to documented load-balancer source CIDRs only.
4. Keep the admin backend loopback-only; publish the admin Nginx host only through its intended VPN/LB path.
5. Verify the provider's original-host, original-client-address, and original-scheme header contract.
6. Configure Nginx `set_real_ip_from` only for verified load-balancer CIDRs. Never trust client-supplied `X-Forwarded-*` headers directly.

Do not finalise HTTPS redirects, HSTS, secure-cookie logic, client-IP rate limits, or audit attribution until the provider's forwarded-header behavior is verified.

## Deferred: real HPC terminal

A future SSO-backed terminal that connects to an actual HPC node is a separate system. It needs its own architecture for per-user authorization, SSH/WebSocket gatewaying, session isolation, restricted homes, resource limits, audit policy, and HPC approval. It must not reuse this static-content VM as a credential or terminal proxy.

## Remaining implementation inputs

- Public/admin DNS names.
- University OIDC/SAML provider details and Admin-group mapping.
- Platform load-balancer health check, source CIDRs, and forwarded-header contract.
- Backend language/framework.
- Restricted Markdown renderer and declarative world schema.
- Off-VM backup destination, retention, and restore-test schedule.

## References

- [NGINX core module](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [NGINX request processing](https://nginx.org/en/docs/http/request_processing.html)
- [NGINX proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [NGINX real-IP module](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
- [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [systemd.exec](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [SQLite WAL](https://www.sqlite.org/wal.html)
- [SQLite Backup API](https://www.sqlite.org/backup.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
