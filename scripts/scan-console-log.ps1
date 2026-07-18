#!/usr/bin/env pwsh
# =============================================================================
# scan-console-log.ps1
# Mendeteksi console.log/warn/error yang tertinggal di seluruh source code
# Menggunakan git grep sehingga .gitignore direspek secara otomatis.
#
# Usage:
#   .\scripts\scan-console-log.ps1
#   .\scripts\scan-console-log.ps1 -ExitOnFound   # exit 1 jika ada temuan (untuk CI)
# =============================================================================

param(
    [switch]$ExitOnFound
)

$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Error "Not inside a git repository."
    exit 1
}
Set-Location $repoRoot

$patterns = @(
    "console\.log\(",
    "console\.warn\(",
    "console\.error\(",
    "console\.debug\(",
    "console\.info\(",
    "console\.table\(",
    "console\.dir\("
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Console Statement Scanner" -ForegroundColor Cyan
Write-Host "  Repo: $repoRoot" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allResults = [System.Collections.Generic.List[PSObject]]::new()

foreach ($pattern in $patterns) {
    $raw = git grep -n -I --perl-regexp $pattern `
        -- "*.ts" "*.vue" "*.js" "*.tsx" "*.jsx" `
           ":!*.test.ts" ":!*.spec.ts" ":!*.test.js" ":!*.spec.js" `
        2>$null

    if (-not $raw) { continue }

    foreach ($line in $raw) {
        if ($line -match '^(.+?):(\d+):(.+)$') {
            $allResults.Add([PSCustomObject]@{
                File    = $matches[1]
                Line    = [int]$matches[2]
                Pattern = $pattern
                Content = $matches[3].Trim()
            })
        }
    }
}

if ($allResults.Count -eq 0) {
    Write-Host "  No console statements found. Clean!" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# Group per file
$grouped = $allResults | Group-Object File | Sort-Object Name

Write-Host "  Found $($allResults.Count) console statement(s) in $($grouped.Count) file(s):" -ForegroundColor Yellow
Write-Host ""

foreach ($group in $grouped) {
    Write-Host "  FILE: $($group.Name)" -ForegroundColor White
    $sorted = $group.Group | Sort-Object Line
    foreach ($item in $sorted) {
        $lineLabel = ("    L" + $item.Line).PadRight(10)
        $color = "Cyan"
        if ($item.Pattern -like "*error*") { $color = "Red" }
        elseif ($item.Pattern -like "*warn*") { $color = "Yellow" }
        Write-Host "$lineLabel $($item.Content)" -ForegroundColor $color
    }
    Write-Host ""
}

# Summary
Write-Host "-----------------------------------------" -ForegroundColor DarkGray
Write-Host "  Summary by type:" -ForegroundColor Gray
$allResults | Group-Object Pattern | Sort-Object Count -Descending | ForEach-Object {
    $patternLabel = ("    " + ($_.Name -replace '\\\.', '.' )).PadRight(28)
    Write-Host "$patternLabel $($_.Count) occurrence(s)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TOTAL: $($allResults.Count) console statement(s) found" -ForegroundColor Yellow
Write-Host "  TIP  : Remove or replace with logger before releasing." -ForegroundColor DarkGray
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($ExitOnFound) {
    exit 1
}
