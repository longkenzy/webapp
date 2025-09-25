# PowerShell script to setup environment variables
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

Write-Host "Setting up environment for: $Environment" -ForegroundColor Green

if ($Environment -eq "dev") {
    $env:DATABASE_URL = "postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev"
    $env:NODE_ENV = "development"
    Write-Host "Development environment configured" -ForegroundColor Yellow
    Write-Host "Database: smartservices_dev (Local PostgreSQL)" -ForegroundColor Cyan
} else {
    $env:DATABASE_URL = "postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices"
    $env:NODE_ENV = "production"
    Write-Host "Production environment configured" -ForegroundColor Red
    Write-Host "Database: smartservices (Local PostgreSQL)" -ForegroundColor Cyan
}

Write-Host "Environment variables set for current session" -ForegroundColor Green
Write-Host "You can now run Prisma commands safely" -ForegroundColor Green
