# Script copy dữ liệu từ Production sang Development (Phiên bản đơn giản)
# Sử dụng pg_dump và pg_restore

Write-Host "=== COPY DỮ LIỆU PRODUCTION SANG DEVELOPMENT (ĐƠN GIẢN) ===" -ForegroundColor Cyan
Write-Host "Script này sử dụng pg_dump để copy dữ liệu" -ForegroundColor Yellow
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
    pg_dump $devUrl > $backupFile
    Write-Host "✅ Backup thành công: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Không thể tạo backup" -ForegroundColor Yellow
    Write-Host "Tiếp tục với việc copy dữ liệu..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 2: Export dữ liệu từ production..." -ForegroundColor Green
$dumpFile = "prod-data-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
Write-Host "Export dữ liệu production: $dumpFile" -ForegroundColor Yellow

try {
    # Export chỉ dữ liệu (không có schema)
    pg_dump --data-only --inserts $prodUrl > $dumpFile
    Write-Host "✅ Export dữ liệu thành công: $dumpFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi export dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Bước 3: Xóa dữ liệu cũ trong development..." -ForegroundColor Green
Write-Host "⚠️  CẢNH BÁO: Sẽ xóa tất cả dữ liệu hiện có trong development" -ForegroundColor Red

$confirmClear = Read-Host "Tiếp tục xóa dữ liệu cũ? (y/N)"
if ($confirmClear -ne "y" -and $confirmClear -ne "Y") {
    Write-Host "Bỏ qua việc xóa dữ liệu cũ" -ForegroundColor Yellow
    Write-Host "Dữ liệu mới sẽ được thêm vào dữ liệu cũ" -ForegroundColor Yellow
} else {
    Write-Host "Xóa dữ liệu cũ trong development..." -ForegroundColor Yellow
    
    # Tạo script xóa dữ liệu
    $clearScript = @"
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
    try {
        psql $devUrl -f "clear-dev-data.sql"
        Write-Host "✅ Xóa dữ liệu cũ thành công" -ForegroundColor Green
        Remove-Item "clear-dev-data.sql" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "❌ Lỗi khi xóa dữ liệu cũ: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Bước 4: Import dữ liệu vào development..." -ForegroundColor Green
Write-Host "Import dữ liệu từ: $dumpFile" -ForegroundColor Yellow

try {
    psql $devUrl -f $dumpFile
    Write-Host "✅ Import dữ liệu thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi import dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Bạn có thể chạy thủ công: psql `"$devUrl`" -f `"$dumpFile`"" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 5: Dọn dẹp file tạm..." -ForegroundColor Green
Remove-Item $dumpFile -ErrorAction SilentlyContinue
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
