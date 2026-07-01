# Git authentication for this repository only

This guide configures Git so **only this project** (`NinfaDelAgua`) uses its own GitHub identity and stored credentials. Other folders on your machine keep using your global Git settings (for example `gh auth` or a different work account).

The remote is HTTPS:

```
https://github.com/IPalos/NinfaDelAgua.git
```

Authentication uses a **Personal Access Token (PAT)** saved in a credentials file inside this repo, referenced from **local** Git config (`.git/config`). Nothing is written to your global `~/.gitconfig` unless you choose the optional `includeIf` approach at the end.

---

## 1. Prerequisites

- Git installed (`git --version`)
- Access to the GitHub account that owns or can push to `IPalos/NinfaDelAgua`
- A GitHub **Personal Access Token** with at least the `repo` scope

### Create a PAT (one-time)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. **Fine-grained** or **Classic** token — either works for a private/personal repo
3. Grant access to the `NinfaDelAgua` repository (or your user’s repos)
4. Copy the token — you will not see it again

Use the token as the **password** when Git asks; the username is your GitHub username (`IPalos`).

---

## 2. Configure local identity (this repo only)

From the project root:

```bash
cd /path/to/NinfaDelAgua

git config --local user.name "IPalos"
git config --local user.email "ignaciopalos.r@gmail.com"
```

Verify (should show values from `.git/config`, not `~/.gitconfig`):

```bash
git config --local --list | grep '^user\.'
```

---

## 3. Store credentials in a repo-local file

### 3a. Ignore the credentials file

Add this line to `.gitignore` so the token is never committed:

```
.git_local_repo_credentials
```

### 3b. Point Git at a repo-local credential store

Your global Git may use `gh auth` for all GitHub URLs. To use **only this repo’s** stored token, override the GitHub-specific helper **locally**:

```bash
# Clear any inherited GitHub helpers for this repo, then use a local store file
git config --local --unset-all credential.https://github.com.helper 2>/dev/null || true
git config --local credential.https://github.com.helper ""
git config --local --add credential.https://github.com.helper "store --file .git_local_repo_credentials"
```

Optional: remove the generic local helper if you set it earlier (the URL-specific block above is enough):

```bash
git config --local --unset-all credential.helper 2>/dev/null || true
```

Check the result:

```bash
git config --local --get-all credential.https://github.com.helper
```

Expected output:

```
store --file .git_local_repo_credentials
```

(An empty first line from `helper ""` is normal — it resets the helper chain for this repository.)

### 3c. Save your token

**Option A — let Git save it on first use (recommended)**

```bash
git fetch origin
```

When prompted:

| Field    | Value              |
|----------|--------------------|
| Username | `IPalos`           |
| Password | your PAT (not your GitHub login password) |

Git writes one line to `.git_local_repo_credentials`.

**Option B — create the file manually**

Create `.git_local_repo_credentials` in the repo root with this format (one line, no spaces around `:`):

```
https://IPalos:ghp_YOUR_TOKEN_HERE@github.com
```

Replace `ghp_YOUR_TOKEN_HERE` with your real token. Restrict file permissions:

```bash
chmod 600 .git_local_repo_credentials
```

---

## 4. Verify push and pull

```bash
git pull origin main
git push origin main
```

You should not be prompted again unless the token expires or is revoked.

Confirm which config is active:

```bash
git config --show-origin --get-regexp '^(user\.|credential\.|remote\.origin)'
```

`user.*` and `credential.https://github.com.*` should come from `file:.git/config`.

---

## 5. Security checklist

- [ ] `.git_local_repo_credentials` is listed in `.gitignore`
- [ ] The credentials file was never `git add`’d
- [ ] File mode is `600` (`chmod 600 .git_local_repo_credentials`)
- [ ] PAT has only the scopes you need; revoke old tokens on GitHub when rotating

If the file was ever committed, rotate the PAT immediately and remove it from Git history.

---

## 6. Troubleshooting

### Still authenticating as the wrong GitHub user

Your global `~/.gitconfig` may still register `gh` for GitHub. Re-run step 3b from this repo’s root. Then confirm:

```bash
git config --local --get-all credential.https://github.com.helper
```

You should see `store --file .git_local_repo_credentials`, not `gh auth git-credential`.

### `remote: Invalid username or token`

- Username must match the GitHub account that owns the token
- Password must be a PAT, not your GitHub account password
- Regenerate the token if it expired or lacks `repo` scope

### Credentials file empty or missing after fetch

Run `git fetch` from the **repository root** so the relative path `.git_local_repo_credentials` resolves correctly. Alternatively use an absolute path:

```bash
git config --local --unset-all credential.https://github.com.helper
git config --local credential.https://github.com.helper ""
git config --local --add credential.https://github.com.helper "store --file /absolute/path/to/NinfaDelAgua/.git_local_repo_credentials"
```

### Want SSH instead of HTTPS

SSH keys are usually global per machine. For directory-only HTTPS auth with a PAT, stay on the setup above. If you prefer SSH for this repo only:

```bash
git remote set-url origin git@github.com:IPalos/NinfaDelAgua.git
```

That uses your default SSH key (`~/.ssh/`), not a repo-local credential file.

---

## 7. Optional: `includeIf` for multiple machines

If you work on several computers, you can mirror the [ERP project pattern](https://git-scm.com/docs/git-config#_conditional_includes): a small snippet file plus a global conditional include.

**`~/.gitconfig-ninfadelagua`:**

```ini
[user]
    name = IPalos
    email = ignaciopalos.r@gmail.com
[credential "https://github.com"]
    helper =
    helper = store --file /absolute/path/to/NinfaDelAgua/.git_local_repo_credentials
```

**Add to `~/.gitconfig`:**

```ini
[includeIf "gitdir:/absolute/path/to/NinfaDelAgua/"]
    path = ~/.gitconfig-ninfadelagua
```

Use the trailing slash on `gitdir:`. This applies whenever you run Git inside that directory tree. The repo-local `.git/config` approach in sections 2–3 is simpler for a single machine and does not touch global config.

---

## Quick reference (copy-paste setup)

```bash
cd /path/to/NinfaDelAgua

git config --local user.name "IPalos"
git config --local user.email "ignaciopalos.r@gmail.com"

git config --local --unset-all credential.https://github.com.helper 2>/dev/null || true
git config --local credential.https://github.com.helper ""
git config --local --add credential.https://github.com.helper "store --file .git_local_repo_credentials"

echo '.git_local_repo_credentials' >> .gitignore

git fetch origin   # enter IPalos + PAT when prompted
git pull origin main
```

After that, `git push` and `git pull` use the credentials stored only for this directory.
