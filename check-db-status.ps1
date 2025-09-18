# Script kiểm tra trạng thái database development và production

Write-Host "=== KIỂM TRA TRẠNG THÁI DATABASE ===" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra development database
Write-Host "1. DEVELOPMENT DATABASE (ep-rapid-dream-a1b4rn5j):" -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "   Schema:" -ForegroundColor Green
npx prisma db pull --schema=src/prisma/schema.prisma --print | Select-Object -First 20

Write-Host ""
Write-Host "   Số lượng bản ghi:" -ForegroundColor Green
try {
    $devStats = @"
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Partner', COUNT(*) FROM "Partner"
UNION ALL
SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL
SELECT 'IncidentType', COUNT(*) FROM "IncidentType"
UNION ALL
SELECT 'Incident', COUNT(*) FROM "Incident"
UNION ALL
SELECT 'MaintenanceCase', COUNT(*) FROM "MaintenanceCase"
UNION ALL
SELECT 'WarrantyCase', COUNT(*) FROM "WarrantyCase"
UNION ALL
SELECT 'InternalCase', COUNT(*) FROM "InternalCase"
UNION ALL
SELECT 'DeliveryCase', COUNT(*) FROM "DeliveryCase"
UNION ALL
SELECT 'ReceivingCase', COUNT(*) FROM "ReceivingCase"
ORDER BY table_name;
"@
    $devStats | Out-File -FilePath "temp-dev-stats.sql" -Encoding UTF8
    psql $env:DATABASE_URL -f "temp-dev-stats.sql"
    Remove-Item "temp-dev-stats.sql" -ErrorAction SilentlyContinue
} catch {
    Write-Host "   Không thể lấy thống kê dữ liệu" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. PRODUCTION DATABASE (ep-broad-truth-a1v49nhu):" -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "   Schema:" -ForegroundColor Green
npx prisma db pull --schema=src/prisma/schema.prisma --print | Select-Object -First 20

Write-Host ""
Write-Host "   Số lượng bản ghi:" -ForegroundColor Green
try {
    $prodStats = @"
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Partner', COUNT(*) FROM "Partner"
UNION ALL
SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL
SELECT 'IncidentType', COUNT(*) FROM "IncidentType"
UNION ALL
SELECT 'Incident', COUNT(*) FROM "Incident"
UNION ALL
SELECT 'MaintenanceCase', COUNT(*) FROM "MaintenanceCase"
UNION ALL
SELECT 'WarrantyCase', COUNT(*) FROM "WarrantyCase"
UNION ALL
SELECT 'InternalCase', COUNT(*) FROM "InternalCase"
UNION ALL
SELECT 'DeliveryCase', COUNT(*) FROM "DeliveryCase"
UNION ALL
SELECT 'ReceivingCase', COUNT(*) FROM "ReceivingCase"
ORDER BY table_name;
"@
    $prodStats | Out-File -FilePath "temp-prod-stats.sql" -Encoding UTF8
    psql $env:DATABASE_URL -f "temp-prod-stats.sql"
    Remove-Item "temp-prod-stats.sql" -ErrorAction SilentlyContinue
} catch {
    Write-Host "   Không thể lấy thống kê dữ liệu" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== KẾT LUẬN ===" -ForegroundColor Cyan
Write-Host "Để đồng bộ development từ production:" -ForegroundColor Yellow
Write-Host "  - Chỉ schema: .\sync-dev-schema-only.ps1" -ForegroundColor Green
Write-Host "  - Schema + dữ liệu: .\sync-dev-from-prod.ps1" -ForegroundColor Red
Write-Host ""
Write-Host "Để chuyển môi trường:" -ForegroundColor Yellow
Write-Host "  - Development: .\to-dev.ps1" -ForegroundColor Green
Write-Host "  - Production: .\to-prod.ps1" -ForegroundColor Red
