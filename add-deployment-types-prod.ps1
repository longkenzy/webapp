# Script to add new deployment types to production database
# This script will add IT helpdesk, system, and network focused deployment types

Write-Host "Adding new deployment types to production database..." -ForegroundColor Green

# Set production database URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try {
    # Execute the SQL script
    Write-Host "Executing SQL script..." -ForegroundColor Yellow
    psql $env:DATABASE_URL -f "add-deployment-types-prod.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully added new deployment types to production database!" -ForegroundColor Green
        Write-Host "Added 12 new deployment types:" -ForegroundColor Cyan
        Write-Host "- Triển khai hệ thống" -ForegroundColor White
        Write-Host "- Triển khai mạng" -ForegroundColor White
        Write-Host "- Triển khai bảo mật" -ForegroundColor White
        Write-Host "- Triển khai backup" -ForegroundColor White
        Write-Host "- Triển khai monitoring" -ForegroundColor White
        Write-Host "- Triển khai user management" -ForegroundColor White
        Write-Host "- Triển khai email server" -ForegroundColor White
        Write-Host "- Triển khai file server" -ForegroundColor White
        Write-Host "- Triển khai print server" -ForegroundColor White
        Write-Host "- Triển khai remote access" -ForegroundColor White
        Write-Host "- Triển khai network security" -ForegroundColor White
        Write-Host "- Triển khai system update" -ForegroundColor White
    } else {
        Write-Host "❌ Error executing SQL script. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Script completed." -ForegroundColor Green
