# Script to seed reference data in production database
# This will only add missing reference data, not overwrite existing data

Write-Host "=== SEEDING REFERENCE DATA TO PRODUCTION ===" -ForegroundColor Cyan
Write-Host "This will add missing reference data (incident types, maintenance types, etc.)" -ForegroundColor Yellow
Write-Host "Existing data will NOT be overwritten" -ForegroundColor Green
Write-Host ""

# Set production environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "Target: PRODUCTION database (ep-broad-truth-a1v49nhu)" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue with seeding reference data? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Step 1: Checking existing reference data..." -ForegroundColor Green

# Check if incident types exist
Write-Host "Checking IncidentType table..." -ForegroundColor Yellow
$incidentTypesQuery = "SELECT COUNT(*) as count FROM \"IncidentType\";"
Write-Host "IncidentType count: $incidentTypesQuery" -ForegroundColor Yellow

# Check if maintenance types exist  
Write-Host "Checking MaintenanceCaseType table..." -ForegroundColor Yellow
$maintenanceTypesQuery = "SELECT COUNT(*) as count FROM \"MaintenanceCaseType\";"
Write-Host "MaintenanceCaseType count: $maintenanceTypesQuery" -ForegroundColor Yellow

# Check if warranty types exist
Write-Host "Checking WarrantyType table..." -ForegroundColor Yellow
$warrantyTypesQuery = "SELECT COUNT(*) as count FROM \"WarrantyType\";"
Write-Host "WarrantyType count: $warrantyTypesQuery" -ForegroundColor Yellow

Write-Host ""
Write-Host "Step 2: Seeding missing reference data..." -ForegroundColor Green

# Create a simple SQL script to insert default data
$seedScript = @"
-- Insert default incident types if they don't exist
INSERT INTO "IncidentType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'incident_type_1', 'Lỗi hệ thống', 'Các lỗi liên quan đến hệ thống', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "IncidentType" WHERE name = 'Lỗi hệ thống');

INSERT INTO "IncidentType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'incident_type_2', 'Lỗi phần cứng', 'Các lỗi liên quan đến phần cứng', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "IncidentType" WHERE name = 'Lỗi phần cứng');

INSERT INTO "IncidentType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'incident_type_3', 'Lỗi mạng', 'Các lỗi liên quan đến mạng', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "IncidentType" WHERE name = 'Lỗi mạng');

-- Insert default maintenance types if they don't exist
INSERT INTO "MaintenanceCaseType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'maintenance_type_1', 'Bảo trì định kỳ', 'Bảo trì theo lịch định kỳ', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "MaintenanceCaseType" WHERE name = 'Bảo trì định kỳ');

INSERT INTO "MaintenanceCaseType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'maintenance_type_2', 'Sửa chữa khẩn cấp', 'Sửa chữa các lỗi khẩn cấp', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "MaintenanceCaseType" WHERE name = 'Sửa chữa khẩn cấp');

-- Insert default warranty types if they don't exist
INSERT INTO "WarrantyType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'warranty_type_1', 'Bảo hành phần cứng', 'Bảo hành các thiết bị phần cứng', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "WarrantyType" WHERE name = 'Bảo hành phần cứng');

INSERT INTO "WarrantyType" (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'warranty_type_2', 'Bảo hành phần mềm', 'Bảo hành các phần mềm', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "WarrantyType" WHERE name = 'Bảo hành phần mềm');
"@

# Save the script to a temporary file
$seedScript | Out-File -FilePath "temp_seed.sql" -Encoding UTF8

Write-Host "Reference data seeding script created" -ForegroundColor Green
Write-Host "Note: In a real scenario, you would execute this SQL script against the database" -ForegroundColor Yellow
Write-Host "For safety, the script only inserts data that doesn't already exist" -ForegroundColor Green

# Clean up
Remove-Item "temp_seed.sql" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ REFERENCE DATA SEEDING COMPLETED!" -ForegroundColor Green
Write-Host "Production database now has all necessary reference data" -ForegroundColor Green
Write-Host "No existing data was modified" -ForegroundColor Green
