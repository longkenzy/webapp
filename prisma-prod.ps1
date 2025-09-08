# PowerShell script for Prisma production commands
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("migrate", "generate", "studio", "deploy")]
    [string]$Command
)

# Set production environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "Using PRODUCTION database: ep-broad-truth-a1v49nhu" -ForegroundColor Red
Write-Host "WARNING: This will affect PRODUCTION data!" -ForegroundColor Red

$confirm = Read-Host "Are you sure you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit
}

switch ($Command) {
    "migrate" {
        Write-Host "Running Prisma migration on PROD database..." -ForegroundColor Red
        npx prisma migrate deploy
    }
    "generate" {
        Write-Host "Generating Prisma client..." -ForegroundColor Green
        npx prisma generate
    }
    "studio" {
        Write-Host "Opening Prisma Studio for PROD database..." -ForegroundColor Red
        npx prisma studio
    }
    "deploy" {
        Write-Host "Deploying migrations to PROD database..." -ForegroundColor Red
        npx prisma migrate deploy
    }
}
