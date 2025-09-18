# Script kiểm tra dữ liệu trong database development

Write-Host "=== KIỂM TRA DỮ LIỆU DATABASE DEVELOPMENT ===" -ForegroundColor Cyan
Write-Host ""

# Chuyển sang development environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "Database: ep-rapid-dream-a1b4rn5j (Development)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Số lượng bản ghi trong các bảng:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Tạo script kiểm tra
$checkScript = @"
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Partner', COUNT(*) FROM "Partner"
UNION ALL
SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL
SELECT 'IncidentType', COUNT(*) FROM "IncidentType"
UNION ALL
SELECT 'MaintenanceType', COUNT(*) FROM "MaintenanceType"
UNION ALL
SELECT 'WarrantyType', COUNT(*) FROM "WarrantyType"
UNION ALL
SELECT 'EvaluationConfig', COUNT(*) FROM "EvaluationConfig"
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
UNION ALL
SELECT 'Notification', COUNT(*) FROM "Notification"
UNION ALL
SELECT 'Schedule', COUNT(*) FROM "Schedule"
ORDER BY table_name;
"@

$checkScript | Out-File -FilePath "temp-check-dev.sql" -Encoding UTF8

try {
    Write-Host "Đang kiểm tra dữ liệu..." -ForegroundColor Yellow
    psql $env:DATABASE_URL -f "temp-check-dev.sql"
    Write-Host ""
    Write-Host "✅ Kiểm tra hoàn thành" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi kiểm tra dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Bạn có thể chạy thủ công: psql `"$env:DATABASE_URL`" -f temp-check-dev.sql" -ForegroundColor Yellow
} finally {
    Remove-Item "temp-check-dev.sql" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Để copy dữ liệu từ production:" -ForegroundColor Yellow
Write-Host "  .\copy-prod-data-simple.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "Để mở Prisma Studio:" -ForegroundColor Yellow
Write-Host "  npx prisma studio --schema=src/prisma/schema.prisma" -ForegroundColor Cyan
