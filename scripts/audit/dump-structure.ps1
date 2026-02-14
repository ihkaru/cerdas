
# Script to dump directory structure excluding common build/dependency folders
$excludeDirs = @('node_modules', 'vendor', '.git', 'dist', 'build', 'public', 'storage', 'coverage', 'android', 'ios', 'tmp', '.agent', '.idea', '.vscode', '.gemini', '.history')

function Show-Tree {
    param (
        [string]$Path,
        [string]$Prefix = ""
    )

    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Sort-Object { $_.PSIsContainer } -Descending

    $count = 0
    $total = $items.Count

    foreach ($item in $items) {
        $count++
        $isLast = $count -eq $total
        
        if ($isLast) {
            $marker = "+-- "
        }
        else {
            $marker = "|-- "
        }
        
        # Color coding: Directories are Cyan, Files are White
        Write-Host "$Prefix$marker" -NoNewline -ForegroundColor Gray
        if ($item.PSIsContainer) {
            Write-Host $item.Name -ForegroundColor Cyan
        }
        else {
            Write-Host $item.Name -ForegroundColor White
        }

        if ($item.PSIsContainer) {
            if ($excludeDirs -notcontains $item.Name) {
                if ($isLast) {
                    $newPrefix = $Prefix + "    "
                }
                else {
                    $newPrefix = $Prefix + "|   "
                }
                Show-Tree -Path $item.FullName -Prefix $newPrefix
            }
        }
    }
}

Write-Host "Project Structure (Excluding: node_modules, vendor, etc...)" -ForegroundColor Green
Show-Tree -Path (Get-Location).Path
