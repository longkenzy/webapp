# PowerShell script for Prisma development commands
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("migrate", "generate", "studio", "seed", "reset")]
    [string]$Command
)

# Set development environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "Using DEVELOPMENT database: ep-rapid-dream-a1b4rn5j" -ForegroundColor Yellow

switch ($Command) {
    "migrate" {
        Write-Host "Running Prisma migration on DEV database..." -ForegroundColor Green
        npx prisma migrate dev
    }
    "generate" {
        Write-Host "Generating Prisma client..." -ForegroundColor Green
        npx prisma generate
    }
    "studio" {
        Write-Host "Opening Prisma Studio for DEV database..." -ForegroundColor Green
        npx prisma studio
    }
    "seed" {
        Write-Host "Seeding DEV database..." -ForegroundColor Green
        npx prisma db seed
    }
    "reset" {
        Write-Host "Resetting DEV database..." -ForegroundColor Red
        Write-Host "This will delete all data in DEV database!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            npx prisma migrate reset
        } else {
            Write-Host "Operation cancelled" -ForegroundColor Yellow
        }
    }
}
