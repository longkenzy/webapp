# Script to deploy new migrations to production database
# This is safe to run after baseline is completed

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Deploying migrations to production"
)

$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "=== PRODUCTION MIGRATION DEPLOYMENT ===" -ForegroundColor Red
Write-Host "Database: ep-broad-truth-a1v49nhu" -ForegroundColor Yellow
Write-Host "Message: $Message" -ForegroundColor Green
Write-Host ""

# Check migration status first
Write-Host "Checking migration status..." -ForegroundColor Cyan
npx prisma migrate status --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Deploying migrations to production..." -ForegroundColor Red
npx prisma migrate deploy --schema=src/prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration deployment completed successfully!" -ForegroundColor Green
    Write-Host "Production database is now up to date with development schema." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
}
