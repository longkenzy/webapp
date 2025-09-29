# Simple script to add incident types to both dev and prod databases
Write-Host "Adding incident types to databases..." -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Get database URLs
$devDbUrl = ""
$prodDbUrl = ""

# Try to read from .env files
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "DATABASE_URL=(.+?)(?:\r?\n|$)") {
        $devDbUrl = $matches[1].Trim()
    }
}

if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "DATABASE_URL=(.+?)(?:\r?\n|$)") {
        $prodDbUrl = $matches[1].Trim()
    }
}

# If URLs not found in env files, ask user
if (-not $devDbUrl) {
    $devDbUrl = Read-Host "Enter Development Database URL"
}

if (-not $prodDbUrl) {
    $prodDbUrl = Read-Host "Enter Production Database URL"
}

# Confirm before proceeding
Write-Host "`nAbout to insert incident types into:" -ForegroundColor Cyan
Write-Host "- Development: $($devDbUrl.Substring(0, [Math]::Min(50, $devDbUrl.Length)))..." -ForegroundColor Yellow
Write-Host "- Production: $($prodDbUrl.Substring(0, [Math]::Min(50, $prodDbUrl.Length)))..." -ForegroundColor Yellow

$confirm = Read-Host "`nDo you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

# Insert into development database
if ($devDbUrl) {
    Write-Host "`nInserting into Development database..." -ForegroundColor Yellow
    $env:DATABASE_URL = $devDbUrl
    node insert-incident-types.js
}

# Insert into production database  
if ($prodDbUrl) {
    Write-Host "`nInserting into Production database..." -ForegroundColor Yellow
    $env:DATABASE_URL = $prodDbUrl
    node insert-incident-types.js
}

Write-Host "`nIncident types insertion completed!" -ForegroundColor Green
Write-Host "You can now use these incident types in your application." -ForegroundColor Cyan
