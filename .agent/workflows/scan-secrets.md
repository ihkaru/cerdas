---
description: Scan for leaked credentials/keys/secrets and remove from git history if found
---

This workflow detects leaked secrets in the codebase and provides tools to clean them from git history.

## Automated (CI)

Secret scanning runs automatically on every push to `main` via GitHub Actions (`secret-scan.yml`). If a critical leak is found, the build fails.

## Manual Scan

// turbo
1. Run the secret scan locally:
```powershell
# Quick check for common patterns
Select-String -Path (Get-ChildItem -Recurse -Include *.php,*.ts,*.js,*.vue,*.json,*.yml,*.yaml -Exclude node_modules,vendor | Where-Object { $_.FullName -notmatch 'node_modules|vendor|\.git' }) -Pattern 'PRIVATE KEY|AKIA[0-9A-Z]{16}|password\s*=\s*["'']' | Format-Table -Wrap
```

## Remove Leaked File from History

If a secret was committed, use the removal script:

// turbo
2. Dry run first (no changes):
```powershell
./scripts/remove-secret-from-history.ps1 -FilePath "path/to/leaked-file" -DryRun
```

3. Remove for real (requires confirmation):
```powershell
./scripts/remove-secret-from-history.ps1 -FilePath "path/to/leaked-file"
```

4. After removal, force push and tell collaborators to re-clone:
```bash
git push origin --force --all
```

### What the CI checks:
- **Private keys** (RSA, SSH, etc.)
- **AWS Access Keys** (`AKIA...`)
- **Hardcoded passwords** in source code
- **API keys/tokens** in source code
- **Database connection strings** with credentials
- **Certificate/keystore files** (`.jks`, `.p12`, `.pem`)
- **`.env` files** committed to repo

### Prerequisites for history cleanup:
- Install `git-filter-repo`: `pip install git-filter-repo`
