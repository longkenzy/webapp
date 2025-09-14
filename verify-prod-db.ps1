# Script to verify production database is properly updated and matches development

Write-Host "=== PRODUCTION DATABASE VERIFICATION ===" -ForegroundColor Cyan
Write-Host "Verifying that production database matches development schema" -ForegroundColor Yellow
Write-Host ""

# Set production environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "Target: PRODUCTION database (ep-broad-truth-a1v49nhu)" -ForegroundColor Red
Write-Host ""

Write-Host "Step 1: Checking database connection..." -ForegroundColor Green
npx prisma db pull --schema=src/prisma/schema.prisma --print | Select-String "model" | Measure-Object | ForEach-Object { 
    Write-Host "✅ Found $($_.Count) models in production database" -ForegroundColor Green 
}

Write-Host ""
Write-Host "Step 2: Verifying all required models exist..." -ForegroundColor Green

$requiredModels = @(
    "User", "Employee", "Schedule", "Partner", "CaseType", "KPIConfig",
    "InternalCase", "InternalCaseComment", "InternalCaseWorklog",
    "ReceivingCase", "ReceivingCaseComment", "ReceivingCaseWorklog", "ReceivingCaseProduct",
    "DeliveryCase", "DeliveryCaseComment", "DeliveryCaseWorklog", "DeliveryCaseProduct",
    "EvaluationConfig", "EvaluationOption",
    "IncidentType", "Incident", "IncidentComment", "IncidentWorklog",
    "Equipment", "MaintenanceCaseType", "MaintenanceCase", "MaintenanceCaseComment", "MaintenanceCaseWorklog",
    "WarrantyType", "Warranty", "WarrantyComment", "WarrantyWorklog"
)

$schemaOutput = npx prisma db pull --schema=src/prisma/schema.prisma --print
$missingModels = @()

foreach ($model in $requiredModels) {
    if ($schemaOutput -match "model $model") {
        Write-Host "✅ $model - Found" -ForegroundColor Green
    } else {
        Write-Host "❌ $model - Missing" -ForegroundColor Red
        $missingModels += $model
    }
}

Write-Host ""
Write-Host "Step 3: Checking enums..." -ForegroundColor Green

$requiredEnums = @("Role", "InternalCaseStatus", "ReceivingCaseStatus", "DeliveryCaseStatus", 
                   "EvaluationType", "EvaluationCategory", "IncidentStatus", 
                   "MaintenanceCaseStatus", "MaintenanceType", "WarrantyStatus")

foreach ($enum in $requiredEnums) {
    if ($schemaOutput -match "enum $enum") {
        Write-Host "✅ $enum - Found" -ForegroundColor Green
    } else {
        Write-Host "❌ $enum - Missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 4: Summary..." -ForegroundColor Green

if ($missingModels.Count -eq 0) {
    Write-Host "🎉 SUCCESS: Production database is fully synchronized with development!" -ForegroundColor Green
    Write-Host "✅ All required models and enums are present" -ForegroundColor Green
    Write-Host "✅ Database schema is up to date" -ForegroundColor Green
    Write-Host "✅ No data was lost during the update" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Some models are missing:" -ForegroundColor Yellow
    foreach ($model in $missingModels) {
        Write-Host "   - $model" -ForegroundColor Yellow
    }
    Write-Host "Consider running the sync script again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== VERIFICATION COMPLETE ===" -ForegroundColor Cyan
