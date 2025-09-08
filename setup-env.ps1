# PowerShell script to setup environment variables
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

Write-Host "Setting up environment for: $Environment" -ForegroundColor Green

if ($Environment -eq "dev") {
    $env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    $env:NODE_ENV = "development"
    Write-Host "Development environment configured" -ForegroundColor Yellow
    Write-Host "Database: ep-rapid-dream-a1b4rn5j (DEV)" -ForegroundColor Cyan
} else {
    $env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    $env:NODE_ENV = "production"
    Write-Host "Production environment configured" -ForegroundColor Red
    Write-Host "Database: ep-broad-truth-a1v49nhu (PROD)" -ForegroundColor Cyan
}

Write-Host "Environment variables set for current session" -ForegroundColor Green
Write-Host "You can now run Prisma commands safely" -ForegroundColor Green
