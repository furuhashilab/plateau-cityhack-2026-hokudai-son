# Research Mac Operating Rules

> Canonical operating rules for the research-lab Mac (`pinkimac`).
>
> These rules apply to any coding agent or CLI tool (including Codex, Claude Code, and Antigravity CLI) operating on this machine, including when accessed remotely over SSH/Tailscale.

## 1. Machine Boundary

Allowed modification boundary:

`/Users/Rito`

Primary rule:

- Do not modify anything outside `/Users/Rito` without explicit Owner approval.
- Treat system directories as read-only.

Do not modify:

- `/System`
- `/Library`
- `/usr`
- `/bin`
- `/sbin`
- `/opt`
- other users' directories
- macOS system configuration

Do not use:

- `sudo`
- `brew`
- system-wide package installation
- system-wide runtime replacement

## 2. Toolchain / Environment Boundary

Do not modify or replace:

- system Python
- system Ruby
- system Java
- system Node.js
- system Flutter/Dart
- macOS developer tool defaults

Use existing user-local or project-local environments wherever possible.

### Python

If Python is required:

1. Check whether an appropriate existing virtual environment exists.
2. Reuse it if appropriate.
3. Otherwise create a virtual environment only under `/Users/Rito`.
4. Prefer a project-local `.venv`.

Example:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install Python packages only inside the virtual environment.

Do not use:

- `sudo pip`
- global `pip install`
- `pip install --break-system-packages`

Before creating a new virtual environment, explain why it is required.

### Node.js

Use the existing user-managed Node/NVM environment where available.

Do not:

- install Node system-wide
- run `npm install -g` unless explicitly approved
- upgrade Node merely because a warning suggests it

### Java / Ruby / Flutter

Use existing project/user-local environments.

Do not modify system Ruby, Java, Flutter, or Dart.

## 3. Dependency Management

Do not automatically install or upgrade dependencies.

Do not treat warnings such as:

> package X is outdated

as permission to upgrade.

Before adding or upgrading a dependency:

1. Explain why it is required.
2. State the exact package and intended version strategy.
3. State which files will change.
4. Confirm that the change is project-local.
5. Request approval if it materially changes the environment or architecture.

Avoid opportunistic major-version upgrades.

## 4. SSH / Tailscale Boundary

The research Mac may be accessed through the existing approved SSH and Tailscale configuration.

Agents may use the existing connection.

Do not modify without explicit Owner approval:

- Tailscale configuration
- Tailscale account/device settings
- SSH server configuration
- macOS Remote Login
- `~/.ssh/config`
- `~/.ssh/authorized_keys`
- SSH agent configuration
- SSH key files

Do not terminate SSH or Tailscale processes unless explicitly instructed.

## 5. Credentials / Secrets

Never print, expose, copy into chat/logs, or commit:

- SSH private keys
- SSH passphrases
- OAuth authorization codes
- OAuth client secrets
- API secrets
- service-account private keys
- Firebase/Auth access tokens
- refresh tokens
- passwords
- raw invitation tokens
- credentials

Do not inspect private-key contents merely to verify them.

Existing authentication mechanisms may be used without exposing secret material.

If a secret is accidentally surfaced, stop and report the exposure without reproducing the secret.

## 6. Production / Paid Infrastructure

Do not enable or modify production/paid infrastructure without explicit Owner approval.

This includes:

- Production Firebase deploy
- Production Cloud Functions deploy
- Production Firestore/RTDB mutation outside approved application behavior
- Google Cloud billing
- Cloud Tasks production enablement
- paid API enablement
- production OAuth configuration
- production domains
- production analytics/crash reporting

Prefer local/emulator environments where possible.

## 7. Git Safety

Before editing:

```bash
git status
git diff --stat
git branch --show-current
```

Do not discard existing user changes.

Do not use without explicit approval:

- `git reset --hard`
- `git clean -fd`
- `git restore .`
- `git checkout -- .`
- force push
- destructive history rewriting
- `git push`

Before committing:

1. Show `git status`.
2. Show `git diff --stat`.
3. Verify scope.
4. Run relevant tests.
5. Check that no secrets are included.

Push always requires explicit approval.

## 8. Destructive Operations

Never automatically run destructive commands.

Examples:

- `rm -rf`
- broad file deletion
- `find ... -delete`
- `truncate`
- database deletion
- credential deletion
- production-resource deletion

If deletion is genuinely necessary:

1. State the exact target.
2. Explain why.
3. Explain the recovery impact.
4. Wait for approval.

## 9. Read Before Write

Before modifying code or configuration:

1. Read the relevant project instructions.
2. Inspect only the files necessary for the task.
3. Summarize the current implementation.
4. Identify the minimum files requiring change.
5. State the proposed change.
6. Proceed only within the approved scope.

Do not scan the entire filesystem or repository without a reason.

## 10. Scope Discipline

Only perform the explicitly requested task.

Do not add unrelated:

- features
- refactors
- dependencies
- analytics
- crash reporting
- infrastructure
- production configuration
- background services

No "while I'm here" changes.

## 11. Testing / Verification

Run the smallest relevant test first.

Then run broader verification as appropriate for the project.

Do not change dependencies simply because a test or tool emits a warning.

## 12. Mandatory STOP Conditions

STOP and ask the Owner before proceeding if the task requires:

- `sudo`
- `brew`
- modification outside `/Users/Rito`
- system-wide installation or runtime change
- modification of SSH/Tailscale
- secret/private-key inspection
- paid infrastructure
- Production deployment
- destructive deletion
- major dependency upgrade
- weakening security/authorization rules
- unresolved architecture/security decision
- conflict between source-of-truth documents

## 13. Agent / CLI Operating Rules

These rules apply when using Codex, Claude Code, Antigravity CLI, or similar coding agents.

- Prefer normal interactive operation for security-sensitive work.
- Do not bypass permission prompts globally.
- Do not use blanket "always allow" rules for shell/write operations.
- Keep non-workspace access disabled where the tool supports it.
- Do not allow an agent to edit outside the active project or `/Users/Rito`.
- Do not let an agent modify SSH/Tailscale/Keychain/authentication configuration.
- Do not let an agent expose OAuth codes, SSH secrets, tokens, or credentials.
- If the agent requests a command outside its sandbox, review the exact command and purpose before approval.
- Do not use dangerous permission-bypass flags unless explicitly approved for a specific task.

When a repository contains its own `AGENTS.md`, `CLAUDE.md`, or project policy file, read it in addition to this document.

If project-specific instructions conflict with these machine-level rules, STOP and report the conflict.
