# UWC HPC deployment and content-administration plan

## Scope and decisions

This plan covers the current static trainer, its future authenticated content-administration service, the temporary direct Nginx TLS setup, and a future platform load balancer that terminates TLS. It deliberately excludes a real web terminal connected to HPC nodes; that is a separate future service requiring its own security review and HPC approval.

| Area | Decision |
|---|---|
| Current hosting | Ubuntu Nginx package, supervised by its existing systemd service. No Docker/Compose. |
| Public site | Static, anonymous, and served by Nginx. |
| Admin site | Same hostname at `/admin/`, restricted to the university VPN. A separate hostname remains a later option. |
| Admin identity | Temporary Django database account with a securely hashed password; replace with university SSO later. |
| Admin role | One `Admin` role may draft and publish. |
| Content source | SQLite on the VM; it generates immutable static learner content. |
| Published content | Static content releases, served by Nginx rather than queried from SQLite. |
| TLS | Nginx currently terminates TLS directly; a future platform load balancer may terminate TLS and forward HTTP to Nginx. |
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

Deploy `index.html`, `legacy.html`, `css/`, `js/`, `content/`, `vendor/`, fonts, and other static assets to a new root-owned release directory. Nginx workers must not be able to modify it.

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

The installable repository copy is the HTTP-origin template `deploy/nginx/uwc-hpc-skills.conf`; it uses `server_name _`. The VM currently has a separately installed HTTPS configuration and certificate under `/etc/nginx/ssl/linux101/`. Never copy its private key into this repository. Keep the HTTP template for the later load-balancer origin configuration.

### Deployment procedure

1. Run `node tools/check.mjs` in the repository.
2. Copy deployable static assets into a new release directory.
3. Point `current` to that release.
4. Install `deploy/nginx/uwc-hpc-skills.conf` as `/etc/nginx/sites-available/uwc-hpc-skills`, enable its symlink in `sites-enabled`, and remove the packaged `sites-enabled/default` symlink because this configuration owns the default listener.
5. Run `sudo nginx -t`; reload only if it succeeds.
6. Validate `curl -I http://127.0.0.1/`, `curl -i http://127.0.0.1/healthz`, `index.html`, and `legacy.html`.
7. Retain the preceding release until validation succeeds. Roll back by repointing `current` and reloading Nginx.
8. After the open-curriculum release is verified, remove the temporary `/prototype/` locations from the VM's HTTPS Nginx server block, run `sudo nginx -t`, reload Nginx, and remove `/srv/uwc-hpc-skills/prototype/`. Future prototypes branch from this production format.

Enable the existing service once:

```bash
sudo systemctl enable --now nginx
```

Do not modify `/lib/systemd/system/nginx.service`.

## Phase 2: content and curriculum model

Stable challenge identities, Topics, and recommended connections live in `js/track/content.js`. Connections explain a useful learning order but never control access: every challenge can be opened directly. Existing interactive prose and worlds remain JavaScript compatibility modules while imported text challenges use ordered JSON block documents. The simulated-shell engine, command implementations, schema, and validators remain developer-owned Git code.

### Authorable content

Admins may author:

- Topics: name, blurb, order, and each challenge's single Topic membership;
- text and code challenge revisions;
- an ordered notebook-style JSON block list containing restricted Typst, callout, and Bash blocks;
- tasks, hint ladders, answers, failure messages, variants, worlds, canned output, and allowed declarative command hooks for code challenges;
- recommended graph connections; and
- drafts and publications.

The block contract is specified in `docs/content-blocks.md`. Typst blocks get a small formatting toolbar and immediate preview. Publication accepts only a documented Typst subset and generates sanitized semantic HTML; the learner browser never evaluates Typst. As Typst's HTML support matures, the subset may expand only after accessibility and rendering tests. Worlds use a limited declarative schema—filesystem data, canned output, variables, and allowed hooks—not arbitrary server-side JavaScript.

### Challenge identity and revisions

A challenge revision ID is six hexadecimal digits:

```text
CCCRRR
```

- `CCC` is the stable three-hex-digit challenge number.
- `RRR` is the three-hex-digit published revision number.
- `00F001` means challenge `00F` (decimal 15), revision `001`.

Challenge number `000` remains the shell introduction and now publishes imported source content as revision `000002`. Existing challenge numbers retain their identity. New imported Shell, Git, and CHPC tutorial challenges use monotonically allocated numbers `016` through `027`; numbers are never reused, including after archival.

Draft saves are mutable and do not consume revision numbers. Successful publication creates new revision numbers only for challenges whose authored content/world changed.

### Content releases and recommended tree

A **content release** is an immutable, atomically published set of changed challenge revisions plus one validated recommended tree. A tree-only edit creates a new content release, not new challenge revisions.

The production home follows the selected Prototype C structure:

- Linux, Git, and HPC appear as large Topic entries with progress;
- opening a Topic shows only its full recommended challenge tree;
- **Your Journey** shows every Topic as one connected tree; and
- every node links directly to its challenge, regardless of progress.

Recommended connections must reference existing challenge numbers and remain acyclic, but they never unlock or lock content. Linux begins with Shell material and branches into navigating/finding/pipes and working-with-files/scripts/loops. Git branches from working with files. HPC follows the Linux basics and will grow into remote systems, data movement, parallel work, scheduler concepts, Slurm, PBS, and common monitoring. Slurm and PBS are names of scheduler branches, not institution labels.

The future graph editor must support both automatic layout generated from the recommended connections and optional manual visual placement of nodes. Manual positions are presentation metadata only: moving a node must not change its connections, ordering, or accessibility, and an Admin must be able to reset a graph to its generated layout.

Publication is blocked unless the candidate release validates block schemas, restricted Typst, source/licence metadata, challenge worlds, answers, worked examples, tree references, acyclicity, generated HTML, and learner rendering. The Admin also gets a learner-equivalent preview before publishing.

### Imported source baseline

The initial text challenges pin and import:

- seven `swcarpentry/shell-novice` episodes at commit `22c5a874725bd3048eb7cfceeafd0db3a5e49a2f`;
- nine beginner `swcarpentry/git-novice` episodes at commit `967bc0b38826039f6554845248c8c294ebff1f56`; and
- the four `chpc-tech-eval/scc` tutorial pages at commit `0d585e40a3a3e6d768c598b31443920c70a4ff9e`.

Each imported episode/tutorial is currently one long text challenge. Existing interactive challenges attach below the closest source lesson. Imported exercises and solutions remain temporary callouts until an Admin splits them into smaller text or code challenges. The CHPC pages are deliberately retained in one place first; their competition-focused and advanced material needs review, cutting, and a gentler progression before it becomes the final HPC curriculum.

Source updates are manual and reviewed. Every challenge shows `author | source | updated`; the initial author is Justin Cheney. Source links target exact pinned file revisions. `/licenses/` records CC BY 4.0 and MIT notices for Carpentries material, Apache 2.0 for CHPC SCC, the required attributions, changes, and where each source is used.

## Phase 3: learner progress and revision policy

Public learners remain anonymous initially. Browser-local progress records only challenge number, revision, chosen variant, started/completed state, and timestamps; it must not retain terminal commands or wrong answers.

### Attempts

- Opening a text challenge starts its persistent reading timer and pins its revision.
- Text challenges use a fixed 120-second timer. The timestamp survives refreshes and continues while the page is in the background; after the delay, the learner explicitly selects **Mark complete**.
- Reveal-hint, terminal-command, or answer-submission starts a code challenge and pins its revision and variant.
- Code challenges complete only when their answer or terminal-state validator succeeds; they have no reading timer.
- Resetting an attempt clears terminal/hint state but stays on the same revision.
- A learner may explicitly abandon an attempt and confirm a start on the newest revision; the system never switches them automatically.
- Completion affects progress display only. It never controls access to another challenge.

### Retention

Keep the newest ten revisions of every challenge. Only the newest five are eligible for unfinished learner attempts.

If an unfinished attempt falls out of the five-revision eligibility window, show a clear restart screen and require confirmation before beginning the newest revision. Completed history remains recorded. An archived challenge is unavailable to new learners but retains its ten newest revisions and eligible started attempts; delete older revisions.

The migration preserves browser-local completions by stable challenge number. Reused imported challenges `000` and `014` publish new `...002` revisions without discarding completion history.

When learner SSO is introduced later, offer a one-time confirmed import of browser-local progress into the account. The account then becomes the cross-device progress record.

## Phase 4: admin backend and publication pipeline

The private Django scaffold in `admin_backend/` defines drafts, immutable challenge revisions, curriculum drafts, content releases, release membership, and audit records. Its first deployment will use Django's database-backed admin account at `/admin/`; university SSO and a separate admin hostname are deferred. Optimistic-concurrency forms, the notebook editor, publication validation/static generation, and export are still required before content editing is production-ready.

### Notebook editor

Creating a challenge begins by choosing `text` or `code`; kind may change only through a validated new revision. The custom editor manages ordered blocks rather than exposing raw JSON:

- **Typst** — source textarea, Bold/Italic/Link controls, syntax help, and live preview;
- **Callout** — note, hint, or warning; imported exercise/solution callouts are temporary;
- **Bash** — command, expected output, and display/copy/run behavior.

Admins can add, edit, remove, and reorder blocks. Each block keeps a stable ID. The form displays author, pinned source, licence, adaptation note, updated date, and text-challenge timer. Author defaults to the authenticated Admin's display name but remains editable before publication. Saving uses optimistic concurrency; it never publishes automatically.

### Service boundary

- Run one backend as a dedicated non-root `uwc-hpc-admin` account.
- Bind it only to `127.0.0.1:<port>` or a Unix socket.
- Reverse proxy `/admin/` through the existing `linux101.eresearch.uwc.ac.za` Nginx host; never expose the backend port through VPC ACLs, security groups, or the load balancer.
- Use a systemd unit with `Restart=on-failure`, `RestartSec=5s`, `WantedBy=multi-user.target`, and a root-readable environment file for secrets.
- Initially use Django's database-backed authentication and password hashing for one administrator. Never store a plaintext password in configuration or the database.
- Keep server-side authorization, secure HttpOnly cookies, CSRF protection, login rate limiting, and deny-by-default authorization. Replace local login with university OIDC/SAML and MFA when those details become available; a separate admin hostname may be introduced then.

Use optimistic concurrency: a save based on an old draft version is rejected and the Admin must reload/reconcile. Do not build live collaborative editing.

### State and audit

SQLite is appropriate for this single VM and low-volume authoring. Keep it outside Nginx and all release roots:

```text
/var/lib/uwc-hpc-admin/content.db
/etc/uwc-hpc-admin.env              # root-owned, mode 0600
```

Use WAL mode, short transactions, and one writer at a time. Every draft save and publication writes an immutable audit record: author, time, changed fields, and prior revision. Rollback publishes a new content release that selects retained older revisions; it never rewrites history.

### Static publication

After validation and preview, publishing generates immutable static learner assets: a current content manifest, ordered block JSON, sanitized HTML fragments, source/licence metadata, and files for retained challenge revisions. Nginx serves these assets; browsers do not query SQLite or compile Typst. This keeps the public learner path static and lets a browser reload a pinned revision.

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

- Whether the later SSO deployment keeps `/admin/` or moves to a separate admin hostname.
- University OIDC/SAML provider details and Admin-group mapping for that later migration.
- Platform load-balancer health check, source CIDRs, and forwarded-header contract.
- Restricted Typst validator/renderer implementation and declarative world schema.
- PBS source material appropriate for beginner instruction; the pinned CHPC SCC source currently covers Slurm but not PBS.
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
