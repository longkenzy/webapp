# Script to compare development and production database schemas
# This helps identify what needs to be updated in production

Write-Host "=== DATABASE SCHEMA COMPARISON ===" -ForegroundColor Cyan
Write-Host "Comparing development vs production database schemas" -ForegroundColor Yellow
Write-Host ""

# Function to get database schema
function Get-DatabaseSchema {
    param([string]$DatabaseName, [string]$DatabaseUrl)
    
    Write-Host "Checking $DatabaseName database..." -ForegroundColor Green
    
    # Set environment
    $env:DATABASE_URL = $DatabaseUrl
    
    # Get schema using Prisma
    Write-Host "Getting schema from $DatabaseName..." -ForegroundColor Yellow
    npx prisma db pull --print | Out-String
}

# Development database
$devUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Production database  
$prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "1. DEVELOPMENT DATABASE SCHEMA:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Get-DatabaseSchema "Development" $devUrl

Write-Host ""
Write-Host "2. PRODUCTION DATABASE SCHEMA:" -ForegroundColor Cyan  
Write-Host "=================================" -ForegroundColor Cyan
Get-DatabaseSchema "Production" $prodUrl

Write-Host ""
Write-Host "=== COMPARISON COMPLETE ===" -ForegroundColor Green
Write-Host "Review the schemas above to identify differences" -ForegroundColor Yellow
Write-Host "Use update-prod-db.ps1 to safely update production" -ForegroundColor Yellow
