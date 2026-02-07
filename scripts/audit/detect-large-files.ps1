$threshold = 400
$extensions = @('.ts', '.tsx', '.js', '.jsx', '.vue', '.php', '.css', '.scss')
$excludeDirs = @('node_modules', 'vendor', '.git', 'dist', 'build', 'public', 'storage', 'coverage', 'android', 'ios', 'tmp', '.agent', '.idea', '.vscode')

Write-Host "Scanning for files with more than $threshold lines..." -ForegroundColor Cyan

function Get-ProjectFiles {
    param (
        [string]$Path
    )

    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue

    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            if ($excludeDirs -notcontains $item.Name) {
                Get-ProjectFiles -Path $item.FullName
            }
        } else {
            if ($extensions -contains $item.Extension) {
                # Process file
                $lineCount = (Get-Content $item.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
                if ($lineCount -gt $threshold) {
                    [PSCustomObject]@{
                        Lines = $lineCount
                        File = $item.FullName.Replace((Get-Location).Path + '\', '')
                    }
                }
            }
        }
    }
}

$largeFiles = Get-ProjectFiles -Path (Get-Location).Path

if (!$largeFiles) {
    Write-Host "Great job! No files found exceeding $threshold lines." -ForegroundColor Green
} else {
    # If explicit single result, wrap in array
    if ($largeFiles -isnot [Array]) { $largeFiles = @($largeFiles) }
    
    $largeFiles | Sort-Object Lines -Descending | Format-Table -AutoSize
    Write-Host "Found $($largeFiles.Count) files exceeding $threshold lines." -ForegroundColor Yellow
}
