# remove-secret-from-history.ps1
# Removes a file from ENTIRE git history using git filter-repo
# Run: ./scripts/remove-secret-from-history.ps1 -FilePath "path/to/leaked-file"
#
# ⚠️ WARNING: This REWRITES git history. All collaborators must re-clone after this.
# ⚠️ BACKUP your repo before running this script.

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,

    [switch]$DryRun
)

Write-Host ""
Write-Host "  Secret History Removal Tool" -ForegroundColor Cyan
Write-Host "  -----------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Check if git-filter-repo is installed
$filterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue
if (-not $filterRepo) {
    Write-Host "  git-filter-repo is not installed." -ForegroundColor Red
    Write-Host "  Install it with: pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host "  Or: pipx install git-filter-repo" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if file exists in git history
$exists = git log --all --full-history -- $FilePath 2>$null
if (-not $exists) {
    Write-Host "  File '$FilePath' not found in git history." -ForegroundColor Green
    Write-Host "  Nothing to remove." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

$commitCount = (git log --all --oneline -- $FilePath | Measure-Object).Count
Write-Host "  File: $FilePath" -ForegroundColor Yellow
Write-Host "  Found in $commitCount commit(s)" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "  [DRY RUN] Would remove '$FilePath' from $commitCount commits." -ForegroundColor Cyan
    Write-Host "  Run without -DryRun to execute." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "  ⚠️  WARNING: This will REWRITE git history!" -ForegroundColor Red
Write-Host "  All collaborators must re-clone after this." -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "  Type 'YES' to confirm"

if ($confirm -ne "YES") {
    Write-Host "  Aborted." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "  Removing '$FilePath' from git history..." -ForegroundColor Yellow

# Run git filter-repo
git filter-repo --invert-paths --path $FilePath --force

Write-Host ""
Write-Host "  Done! File removed from all commits." -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Add '$FilePath' to .gitignore (if not already)" -ForegroundColor Gray
Write-Host "    2. Force push:  git push origin --force --all" -ForegroundColor Gray
Write-Host "    3. Tell all collaborators to re-clone the repo" -ForegroundColor Gray
Write-Host "    4. Rotate any compromised credentials immediately" -ForegroundColor Yellow
Write-Host ""
