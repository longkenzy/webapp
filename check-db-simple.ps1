# Check Current Database
Write-Host "Checking current database..." -ForegroundColor Green
if ($env:DATABASE_URL -like "*ep-rapid-dream-a1b4rn5j*") {
    Write-Host "Current: DEVELOPMENT database" -ForegroundColor Yellow
} elseif ($env:DATABASE_URL -like "*ep-broad-truth-a1v49nhu*") {
    Write-Host "Current: PRODUCTION database" -ForegroundColor Red
} else {
    Write-Host "Unknown database" -ForegroundColor Yellow
}






