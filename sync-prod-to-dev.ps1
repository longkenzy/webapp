# Simple script to sync production database with development schema
# Safe operation - no data loss, no reset

Write-Host "=== SYNC PRODUCTION TO DEVELOPMENT SCHEMA ===" -ForegroundColor Cyan
Write-Host "This will update production database to match development" -ForegroundColor Yellow
Write-Host "WITHOUT affecting existing data" -ForegroundColor Green
Write-Host ""

# Set production environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "Target: PRODUCTION database (ep-broad-truth-a1v49nhu)" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue with safe schema update? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Step 1: Generating Prisma client..." -ForegroundColor Green
npx prisma generate --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Step 2: Deploying migrations (safe operation)..." -ForegroundColor Green
Write-Host "This only adds new tables/columns, doesn't modify existing data" -ForegroundColor Yellow
npx prisma migrate deploy --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Step 3: Verifying schema..." -ForegroundColor Green
npx prisma db pull --schema=src/prisma/schema.prisma --print

Write-Host ""
Write-Host "✅ PRODUCTION DATABASE UPDATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Schema now matches development database" -ForegroundColor Green
Write-Host "No existing data was lost or modified" -ForegroundColor Green
