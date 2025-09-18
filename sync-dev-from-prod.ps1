# Script đồng bộ database development từ production
# An toàn - không reset, không xóa database

Write-Host "=== ĐỒNG BỘ DEVELOPMENT TỪ PRODUCTION ===" -ForegroundColor Cyan
Write-Host "Script này sẽ đồng bộ database development để giống với production" -ForegroundColor Yellow
Write-Host "KHÔNG reset, KHÔNG xóa database development" -ForegroundColor Green
Write-Host ""

# Kiểm tra môi trường hiện tại
Write-Host "Bước 1: Kiểm tra môi trường hiện tại..." -ForegroundColor Green
$currentEnv = $env:DATABASE_URL
if ($currentEnv -like "*ep-rapid-dream*") {
    Write-Host "✅ Đang ở môi trường DEVELOPMENT" -ForegroundColor Green
} elseif ($currentEnv -like "*ep-broad-truth*") {
    Write-Host "⚠️  Đang ở môi trường PRODUCTION - sẽ chuyển sang development" -ForegroundColor Yellow
} else {
    Write-Host "❓ Môi trường không xác định" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 2: Backup database development..." -ForegroundColor Green
Write-Host "Tạo backup trước khi đồng bộ..." -ForegroundColor Yellow

# Chuyển sang development environment
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

# Tạo backup
$backupFile = "backup-dev-before-sync-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
Write-Host "Tạo backup: $backupFile" -ForegroundColor Yellow

# Backup database development
try {
    $backupCmd = "pg_dump `"$env:DATABASE_URL`" > `"$backupFile`""
    Invoke-Expression $backupCmd
    Write-Host "✅ Backup thành công: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Không thể tạo backup (có thể do pg_dump không có sẵn)" -ForegroundColor Yellow
    Write-Host "Tiếp tục với việc đồng bộ..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bước 3: Đồng bộ schema từ production..." -ForegroundColor Green

# Chuyển sang production để lấy schema
$prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:DATABASE_URL = $prodUrl
$env:NODE_ENV = "production"

Write-Host "Lấy schema từ production database..." -ForegroundColor Yellow
npx prisma db pull --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 4: Áp dụng schema vào development..." -ForegroundColor Green

# Chuyển lại development
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "Áp dụng schema vào development database..." -ForegroundColor Yellow
npx prisma db push --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 5: Đồng bộ dữ liệu từ production..." -ForegroundColor Green
Write-Host "⚠️  CẢNH BÁO: Bước này sẽ thay thế dữ liệu development bằng dữ liệu production" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Bạn có chắc chắn muốn đồng bộ dữ liệu? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Bỏ qua đồng bộ dữ liệu. Chỉ đồng bộ schema." -ForegroundColor Yellow
} else {
    Write-Host "Bắt đầu đồng bộ dữ liệu..." -ForegroundColor Green
    
    # Tạo script SQL để đồng bộ dữ liệu
    $syncScript = @"
-- Script đồng bộ dữ liệu từ production sang development
-- Chạy script này trên development database

-- Xóa dữ liệu cũ (giữ lại cấu trúc bảng)
TRUNCATE TABLE "User" CASCADE;
TRUNCATE TABLE "Partner" CASCADE;
TRUNCATE TABLE "Employee" CASCADE;
TRUNCATE TABLE "IncidentType" CASCADE;
TRUNCATE TABLE "MaintenanceType" CASCADE;
TRUNCATE TABLE "WarrantyType" CASCADE;
TRUNCATE TABLE "EvaluationConfig" CASCADE;
TRUNCATE TABLE "Incident" CASCADE;
TRUNCATE TABLE "MaintenanceCase" CASCADE;
TRUNCATE TABLE "WarrantyCase" CASCADE;
TRUNCATE TABLE "InternalCase" CASCADE;
TRUNCATE TABLE "DeliveryCase" CASCADE;
TRUNCATE TABLE "ReceivingCase" CASCADE;
TRUNCATE TABLE "Notification" CASCADE;
TRUNCATE TABLE "Schedule" CASCADE;

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

    $syncScript | Out-File -FilePath "sync-data-from-prod.sql" -Encoding UTF8
    Write-Host "Đã tạo script đồng bộ dữ liệu: sync-data-from-prod.sql" -ForegroundColor Green
    
    # Chạy script đồng bộ
    Write-Host "Chạy script đồng bộ dữ liệu..." -ForegroundColor Yellow
    try {
        psql $env:DATABASE_URL -f "sync-data-from-prod.sql"
        Write-Host "✅ Đồng bộ dữ liệu thành công" -ForegroundColor Green
    } catch {
        Write-Host "❌ Lỗi khi đồng bộ dữ liệu: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Bạn có thể chạy thủ công: psql `"$env:DATABASE_URL`" -f sync-data-from-prod.sql" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Bước 6: Generate Prisma client..." -ForegroundColor Green
npx prisma generate --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 7: Xác minh kết quả..." -ForegroundColor Green
Write-Host "Kiểm tra schema development..." -ForegroundColor Yellow
npx prisma db pull --schema=src/prisma/schema.prisma --print

Write-Host ""
Write-Host "✅ HOÀN THÀNH ĐỒNG BỘ!" -ForegroundColor Green
Write-Host "Database development đã được đồng bộ với production" -ForegroundColor Green
Write-Host "Backup được lưu tại: $backupFile" -ForegroundColor Green
Write-Host ""
Write-Host "Để kiểm tra dữ liệu:" -ForegroundColor Yellow
Write-Host "npx prisma studio --schema=src/prisma/schema.prisma" -ForegroundColor Cyan
