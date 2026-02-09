# audit-octane-safety.ps1
# Scans Laravel backend for patterns that are unsafe for Laravel Octane
# Run: ./scripts/audit-octane-safety.ps1

param(
    [string]$Path = "apps/backend/app"
)

Write-Host ""
Write-Host "  Octane Safety Audit" -ForegroundColor Cyan
Write-Host "  Scanning: $Path" -ForegroundColor Gray
Write-Host "  -----------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

$totalIssues = 0

function Test-Pattern {
    param([string]$Label, [string]$Sev, [string]$Pat, [string]$Why, [string]$Dir)
    $hits = Get-ChildItem -Path $Dir -Recurse -Filter "*.php" | Select-String -Pattern $Pat
    if ($hits -and $hits.Count -gt 0) {
        $count = $hits.Count
        $c = if ($Sev -eq "CRITICAL") { "Red" } elseif ($Sev -eq "WARNING") { "Yellow" } else { "DarkYellow" }
        Write-Host "  [$Sev] $Label ($count)" -ForegroundColor $c
        Write-Host "    Why: $Why" -ForegroundColor DarkGray
        foreach ($h in $hits) {
            $rel = $h.Path.Replace((Get-Location).Path + "\", "")
            Write-Host "    $($rel):$($h.LineNumber): $($h.Line.Trim())" -ForegroundColor Gray
        }
        Write-Host ""
        $script:totalIssues += $count
    }
}

# === CRITICAL: State leaks between requests ===
Write-Host "  CRITICAL checks..." -ForegroundColor Red

Test-Pattern "Static mutable properties" "CRITICAL" `
    'static\s+(public|private|protected)\s+\$' `
    "Persist across requests, data leaks between users" $Path

Test-Pattern "Global variables" "CRITICAL" `
    'global\s+\$' `
    "Shared across all requests in a worker" $Path

Test-Pattern "Session/Globals superglobal" "CRITICAL" `
    '\$_(SESSION|GLOBALS)' `
    "Unreliable in Octane, use Laravel helpers" $Path

# === WARNING: Potentially unsafe patterns ===
Write-Host "  WARNING checks..." -ForegroundColor Yellow

Test-Pattern "Runtime config set" "WARNING" `
    'config\(\)->set\(|Config::set\(' `
    "Config changes persist until worker restart" $Path

Test-Pattern "env() in app code" "WARNING" `
    '\benv\(' `
    "Returns null when cached. Use config() instead" $Path

Test-Pattern "Singleton binding" "WARNING" `
    '->singleton\(' `
    "Persist across requests, check for mutable state" $Path

Test-Pattern "Direct SERVER access" "WARNING" `
    '\$_SERVER\[' `
    "Use request()->server() instead" $Path

Test-Pattern "Direct REQUEST/GET/POST" "WARNING" `
    '\$_(REQUEST|GET|POST)\[' `
    "Use request()->input() instead" $Path

# === INFO: Worth reviewing ===
Write-Host "  INFO checks..." -ForegroundColor DarkYellow

Test-Pattern "File-based state" "INFO" `
    'file_put_contents|file_get_contents.*tmp' `
    "Consider Redis/Cache for high-concurrency" $Path

# === Summary ===
Write-Host "  -----------------------------------------------" -ForegroundColor DarkGray
if ($totalIssues -eq 0) {
    Write-Host "  OK: No Octane-unsafe patterns found! Code is ready for Octane." -ForegroundColor Green
} else {
    Write-Host "  WARNING: Found $totalIssues potential issue(s). Review before Octane deploy." -ForegroundColor Yellow
}
Write-Host ""
