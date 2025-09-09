# PowerShell script to setup DEVELOPMENT database environment
Write-Host "Setting up DEVELOPMENT database environment..." -ForegroundColor Green

# Set development environment variables
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "✅ Development environment configured" -ForegroundColor Yellow
Write-Host "📊 Database: ep-rapid-dream-a1b4rn5j (DEVELOPMENT)" -ForegroundColor Cyan
Write-Host "🔧 NODE_ENV: development" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run development commands:" -ForegroundColor Green
Write-Host "  - npx prisma studio" -ForegroundColor White
Write-Host "  - npx prisma db push" -ForegroundColor White
Write-Host "  - npx prisma migrate dev" -ForegroundColor White
Write-Host "  - node seed-incident-types.js" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  WARNING: This is DEVELOPMENT database only!" -ForegroundColor Red





