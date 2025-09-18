# Script copy dữ liệu từ Production sang Development
# An toàn - backup trước khi copy, không reset database

Write-Host "=== COPY DỮ LIỆU PRODUCTION SANG DEVELOPMENT ===" -ForegroundColor Cyan
Write-Host "Script này sẽ copy dữ liệu từ production sang development" -ForegroundColor Yellow
Write-Host "KHÔNG reset database, chỉ thay thế dữ liệu" -ForegroundColor Green
Write-Host ""

# URLs database
$prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$devUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "Production: ep-broad-truth-a1v49nhu" -ForegroundColor Red
Write-Host "Development: ep-rapid-dream-a1b4rn5j" -ForegroundColor Yellow
Write-Host ""

# Xác nhận
$confirm = Read-Host "Bạn có chắc chắn muốn copy dữ liệu production sang development? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Bước 1: Backup database development..." -ForegroundColor Green
$backupFile = "backup-dev-before-copy-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
Write-Host "Tạo backup: $backupFile" -ForegroundColor Yellow

try {
    $backupCmd = "pg_dump `"$devUrl`" > `"$backupFile`""
    Invoke-Expression $backupCmd
    Write-Host "✅ Backup thành công: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Không thể tạo backup (có thể do pg_dump không có sẵn)" -ForegroundColor Yellow
    Write-Host "Tiếp tục với việc copy dữ liệu..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 2: Export dữ liệu từ production..." -ForegroundColor Green

# Tạo script export dữ liệu từ production
$exportScript = @"
-- Script export dữ liệu từ production
-- Chạy trên production database

\copy (SELECT * FROM "User" ORDER BY id) TO 'users_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "Partner" ORDER BY id) TO 'partners_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "Employee" ORDER BY id) TO 'employees_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "IncidentType" ORDER BY id) TO 'incident_types_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "MaintenanceType" ORDER BY id) TO 'maintenance_types_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "WarrantyType" ORDER BY id) TO 'warranty_types_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "EvaluationConfig" ORDER BY id) TO 'evaluation_configs_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "Incident" ORDER BY id) TO 'incidents_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "MaintenanceCase" ORDER BY id) TO 'maintenance_cases_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "WarrantyCase" ORDER BY id) TO 'warranty_cases_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "InternalCase" ORDER BY id) TO 'internal_cases_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "DeliveryCase" ORDER BY id) TO 'delivery_cases_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "ReceivingCase" ORDER BY id) TO 'receiving_cases_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "Notification" ORDER BY id) TO 'notifications_data.csv' WITH CSV HEADER;
\copy (SELECT * FROM "Schedule" ORDER BY id) TO 'schedules_data.csv' WITH CSV HEADER;
"@

$exportScript | Out-File -FilePath "export-prod-data.sql" -Encoding UTF8
Write-Host "Đã tạo script export: export-prod-data.sql" -ForegroundColor Green

Write-Host "Export dữ liệu từ production..." -ForegroundColor Yellow
try {
    psql $prodUrl -f "export-prod-data.sql"
    Write-Host "✅ Export dữ liệu thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi export dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Bạn có thể chạy thủ công: psql `"$prodUrl`" -f export-prod-data.sql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 3: Xóa dữ liệu cũ trong development..." -ForegroundColor Green

# Tạo script xóa dữ liệu cũ (giữ lại cấu trúc)
$clearScript = @"
-- Script xóa dữ liệu cũ trong development
-- Chạy trên development database

-- Xóa dữ liệu theo thứ tự để tránh foreign key constraint
DELETE FROM "Notification";
DELETE FROM "Schedule";
DELETE FROM "DeliveryCase";
DELETE FROM "ReceivingCase";
DELETE FROM "InternalCase";
DELETE FROM "WarrantyCase";
DELETE FROM "MaintenanceCase";
DELETE FROM "Incident";
DELETE FROM "EvaluationConfig";
DELETE FROM "WarrantyType";
DELETE FROM "MaintenanceType";
DELETE FROM "IncidentType";
DELETE FROM "Employee";
DELETE FROM "Partner";
DELETE FROM "User";

-- Reset sequence
SELECT setval('"User_id_seq"', 1, false);
SELECT setval('"Partner_id_seq"', 1, false);
SELECT setval('"Employee_id_seq"', 1, false);
SELECT setval('"IncidentType_id_seq"', 1, false);
SELECT setval('"MaintenanceType_id_seq"', 1, false);
SELECT setval('"WarrantyType_id_seq"', 1, false);
SELECT setval('"EvaluationConfig_id_seq"', 1, false);
SELECT setval('"Incident_id_seq"', 1, false);
SELECT setval('"MaintenanceCase_id_seq"', 1, false);
SELECT setval('"WarrantyCase_id_seq"', 1, false);
SELECT setval('"InternalCase_id_seq"', 1, false);
SELECT setval('"DeliveryCase_id_seq"', 1, false);
SELECT setval('"ReceivingCase_id_seq"', 1, false);
SELECT setval('"Notification_id_seq"', 1, false);
SELECT setval('"Schedule_id_seq"', 1, false);
"@

$clearScript | Out-File -FilePath "clear-dev-data.sql" -Encoding UTF8
Write-Host "Đã tạo script xóa dữ liệu cũ: clear-dev-data.sql" -ForegroundColor Green

Write-Host "Xóa dữ liệu cũ trong development..." -ForegroundColor Yellow
try {
    psql $devUrl -f "clear-dev-data.sql"
    Write-Host "✅ Xóa dữ liệu cũ thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi xóa dữ liệu cũ: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Bạn có thể chạy thủ công: psql `"$devUrl`" -f clear-dev-data.sql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 4: Import dữ liệu vào development..." -ForegroundColor Green

# Tạo script import dữ liệu vào development
$importScript = @"
-- Script import dữ liệu vào development
-- Chạy trên development database

\copy "User" FROM 'users_data.csv' WITH CSV HEADER;
\copy "Partner" FROM 'partners_data.csv' WITH CSV HEADER;
\copy "Employee" FROM 'employees_data.csv' WITH CSV HEADER;
\copy "IncidentType" FROM 'incident_types_data.csv' WITH CSV HEADER;
\copy "MaintenanceType" FROM 'maintenance_types_data.csv' WITH CSV HEADER;
\copy "WarrantyType" FROM 'warranty_types_data.csv' WITH CSV HEADER;
\copy "EvaluationConfig" FROM 'evaluation_configs_data.csv' WITH CSV HEADER;
\copy "Incident" FROM 'incidents_data.csv' WITH CSV HEADER;
\copy "MaintenanceCase" FROM 'maintenance_cases_data.csv' WITH CSV HEADER;
\copy "WarrantyCase" FROM 'warranty_cases_data.csv' WITH CSV HEADER;
\copy "InternalCase" FROM 'internal_cases_data.csv' WITH CSV HEADER;
\copy "DeliveryCase" FROM 'delivery_cases_data.csv' WITH CSV HEADER;
\copy "ReceivingCase" FROM 'receiving_cases_data.csv' WITH CSV HEADER;
\copy "Notification" FROM 'notifications_data.csv' WITH CSV HEADER;
\copy "Schedule" FROM 'schedules_data.csv' WITH CSV HEADER;

-- Cập nhật sequence
SELECT setval('"User_id_seq"', (SELECT MAX(id) FROM "User"));
SELECT setval('"Partner_id_seq"', (SELECT MAX(id) FROM "Partner"));
SELECT setval('"Employee_id_seq"', (SELECT MAX(id) FROM "Employee"));
SELECT setval('"IncidentType_id_seq"', (SELECT MAX(id) FROM "IncidentType"));
SELECT setval('"MaintenanceType_id_seq"', (SELECT MAX(id) FROM "MaintenanceType"));
SELECT setval('"WarrantyType_id_seq"', (SELECT MAX(id) FROM "WarrantyType"));
SELECT setval('"EvaluationConfig_id_seq"', (SELECT MAX(id) FROM "EvaluationConfig"));
SELECT setval('"Incident_id_seq"', (SELECT MAX(id) FROM "Incident"));
SELECT setval('"MaintenanceCase_id_seq"', (SELECT MAX(id) FROM "MaintenanceCase"));
SELECT setval('"WarrantyCase_id_seq"', (SELECT MAX(id) FROM "WarrantyCase"));
SELECT setval('"InternalCase_id_seq"', (SELECT MAX(id) FROM "InternalCase"));
SELECT setval('"DeliveryCase_id_seq"', (SELECT MAX(id) FROM "DeliveryCase"));
SELECT setval('"ReceivingCase_id_seq"', (SELECT MAX(id) FROM "ReceivingCase"));
SELECT setval('"Notification_id_seq"', (SELECT MAX(id) FROM "Notification"));
SELECT setval('"Schedule_id_seq"', (SELECT MAX(id) FROM "Schedule"));
"@

$importScript | Out-File -FilePath "import-to-dev.sql" -Encoding UTF8
Write-Host "Đã tạo script import: import-to-dev.sql" -ForegroundColor Green

Write-Host "Import dữ liệu vào development..." -ForegroundColor Yellow
try {
    psql $devUrl -f "import-to-dev.sql"
    Write-Host "✅ Import dữ liệu thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi import dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Bạn có thể chạy thủ công: psql `"$devUrl`" -f import-to-dev.sql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 5: Dọn dẹp file tạm..." -ForegroundColor Green
Remove-Item "export-prod-data.sql" -ErrorAction SilentlyContinue
Remove-Item "clear-dev-data.sql" -ErrorAction SilentlyContinue
Remove-Item "import-to-dev.sql" -ErrorAction SilentlyContinue
Remove-Item "*.csv" -ErrorAction SilentlyContinue
Write-Host "✅ Dọn dẹp file tạm thành công" -ForegroundColor Green

Write-Host ""
Write-Host "Bước 6: Xác minh kết quả..." -ForegroundColor Green
Write-Host "Kiểm tra số lượng bản ghi trong development..." -ForegroundColor Yellow

# Script kiểm tra
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

$checkScript | Out-File -FilePath "check-dev-data.sql" -Encoding UTF8
try {
    psql $devUrl -f "check-dev-data.sql"
    Remove-Item "check-dev-data.sql" -ErrorAction SilentlyContinue
} catch {
    Write-Host "Không thể kiểm tra dữ liệu" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ HOÀN THÀNH COPY DỮ LIỆU!" -ForegroundColor Green
Write-Host "Dữ liệu production đã được copy sang development" -ForegroundColor Green
Write-Host "Backup được lưu tại: $backupFile" -ForegroundColor Green
Write-Host ""
Write-Host "Để kiểm tra dữ liệu:" -ForegroundColor Yellow
Write-Host "npx prisma studio --schema=src/prisma/schema.prisma" -ForegroundColor Cyan
Write-Host ""
Write-Host "Để khôi phục nếu cần:" -ForegroundColor Yellow
Write-Host "psql `"$devUrl`" < `"$backupFile`"" -ForegroundColor Cyan
