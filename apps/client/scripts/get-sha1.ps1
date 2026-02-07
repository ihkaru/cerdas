$keystorePath = "$env:USERPROFILE\.android\debug.keystore"

if (-not (Test-Path $keystorePath)) {
    Write-Host "Debug keystore not found at $keystorePath" -ForegroundColor Red
    Write-Host "Run 'npx cap run android' once to generate it, or open Android Studio." -ForegroundColor Yellow
    exit
}

Write-Host "Retrieving SHA-1 Fingerprint from debug.keystore..." -ForegroundColor Cyan
try {
    # Get raw output
    $rawOutput = keytool -list -v -keystore "$keystorePath" -alias androiddebugkey -storepass android -keypass android | Select-String "SHA1:"
    
    # Process string to remove label and whitespace
    if ($rawOutput) {
        $cleanSha1 = $rawOutput.ToString().Replace("SHA1:", "").Trim()
        Write-Host "SHA-1 Fingerprint (Copy this):" -ForegroundColor Cyan
        Write-Host $cleanSha1 -ForegroundColor Green
    } else {
        Write-Host "Could not find SHA1 in keytool output." -ForegroundColor Red
    }
} catch {
    Write-Host "Error running keytool. Make sure Java/Android Studio is installed and keytool is in your PATH." -ForegroundColor Red
}
Write-Host "`nCopy the SHA1 value above and paste it into Google Cloud Console > Credentials > Create/Edit Android Client ID" -ForegroundColor Green
