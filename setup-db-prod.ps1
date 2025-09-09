# PowerShell script to setup PRODUCTION database environment
Write-Host "Setting up PRODUCTION database environment..." -ForegroundColor Red

# Set production environment variables
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "✅ Production environment configured" -ForegroundColor Red
Write-Host "📊 Database: ep-broad-truth-a1v49nhu (PRODUCTION)" -ForegroundColor Cyan
Write-Host "🔧 NODE_ENV: production" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run production commands:" -ForegroundColor Green
Write-Host "  - npx prisma db push" -ForegroundColor White
Write-Host "  - npx prisma migrate deploy" -ForegroundColor White
Write-Host ""
Write-Host "🚨 CRITICAL WARNING: This is PRODUCTION database!" -ForegroundColor Red
Write-Host "🚨 Be extremely careful with any changes!" -ForegroundColor Red


