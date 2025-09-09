# PowerShell script to check current database environment
Write-Host "Checking current database environment..." -ForegroundColor Green
Write-Host ""

if ($env:DATABASE_URL) {
    if ($env:DATABASE_URL -like "*ep-rapid-dream-a1b4rn5j*") {
        Write-Host "✅ Current Environment: DEVELOPMENT" -ForegroundColor Yellow
        Write-Host "📊 Database: ep-rapid-dream-a1b4rn5j (DEV)" -ForegroundColor Cyan
        Write-Host "🔧 NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan
    } elseif ($env:DATABASE_URL -like "*ep-broad-truth-a1v49nhu*") {
        Write-Host "🚨 Current Environment: PRODUCTION" -ForegroundColor Red
        Write-Host "📊 Database: ep-broad-truth-a1v49nhu (PROD)" -ForegroundColor Cyan
        Write-Host "🔧 NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  WARNING: You are connected to PRODUCTION database!" -ForegroundColor Red
    } else {
        Write-Host "❓ Unknown database environment" -ForegroundColor Yellow
        Write-Host "📊 Database URL: $env:DATABASE_URL" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ No DATABASE_URL environment variable set" -ForegroundColor Red
    Write-Host "Run setup-db-dev.ps1 or setup-db-prod.ps1 first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Available commands:" -ForegroundColor Green
Write-Host "  .\setup-db-dev.ps1   - Switch to DEVELOPMENT database" -ForegroundColor White
Write-Host "  .\setup-db-prod.ps1  - Switch to PRODUCTION database" -ForegroundColor White
Write-Host "  .\check-current-db.ps1 - Check current environment" -ForegroundColor White





