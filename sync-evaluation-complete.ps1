# Script đồng bộ dữ liệu EvaluationConfig và EvaluationOption từ Dev sang Production
# Phiên bản hoàn chỉnh - đồng bộ an toàn với backup

Write-Host "=== ĐỒNG BỘ DỮ LIỆU EVALUATION (HOÀN CHỈNH) ===" -ForegroundColor Cyan
Write-Host "Đồng bộ EvaluationConfig và EvaluationOption từ Dev sang Production" -ForegroundColor Yellow
Write-Host "An toàn - có backup và khôi phục" -ForegroundColor Green
Write-Host ""

# URLs database
$devUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "Development: ep-rapid-dream-a1b4rn5j" -ForegroundColor Yellow
Write-Host "Production: ep-broad-truth-a1v49nhu" -ForegroundColor Red
Write-Host ""

# Xác nhận
$confirm = Read-Host "Bạn có chắc chắn muốn đồng bộ dữ liệu evaluation? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Bước 1: Kiểm tra dữ liệu evaluation trong development..." -ForegroundColor Green

# Kiểm tra dữ liệu trong dev
$checkDevScript = @"
SELECT 
    'EvaluationConfig' as table_name, 
    COUNT(*) as count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM "EvaluationConfig"
UNION ALL
SELECT 
    'EvaluationOption', 
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
FROM "EvaluationOption"
ORDER BY table_name;
"@

$checkDevScript | Out-File -FilePath "check-dev-evaluation.sql" -Encoding UTF8
Write-Host "Kiểm tra dữ liệu evaluation trong development..." -ForegroundColor Yellow
try {
    psql $devUrl -f "check-dev-evaluation.sql"
    Write-Host "✅ Kiểm tra dữ liệu development thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi kiểm tra dữ liệu development" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 2: Tạo backup dữ liệu evaluation trong production..." -ForegroundColor Green

# Tạo backup với timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupScript = @"
-- Tạo backup dữ liệu evaluation hiện tại
CREATE TABLE IF NOT EXISTS "EvaluationConfig_backup_$timestamp" AS 
SELECT * FROM "EvaluationConfig";

CREATE TABLE IF NOT EXISTS "EvaluationOption_backup_$timestamp" AS 
SELECT * FROM "EvaluationOption";

-- Hiển thị thông tin backup
SELECT 'Backup created successfully' as status;
SELECT COUNT(*) as config_count FROM "EvaluationConfig_backup_$timestamp";
SELECT COUNT(*) as option_count FROM "EvaluationOption_backup_$timestamp";
"@

$backupScript | Out-File -FilePath "backup-prod-evaluation.sql" -Encoding UTF8
Write-Host "Tạo backup dữ liệu evaluation trong production..." -ForegroundColor Yellow
try {
    psql $prodUrl -f "backup-prod-evaluation.sql"
    Write-Host "✅ Backup thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi tạo backup" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 3: Export dữ liệu evaluation từ development..." -ForegroundColor Green

# Export từ dev
$exportScript = @"
\copy (SELECT * FROM "EvaluationConfig" ORDER BY id) TO 'evaluation_configs_dev.csv' WITH CSV HEADER;
\copy (SELECT * FROM "EvaluationOption" ORDER BY id) TO 'evaluation_options_dev.csv' WITH CSV HEADER;
"@

$exportScript | Out-File -FilePath "export-evaluation-dev.sql" -Encoding UTF8
Write-Host "Export dữ liệu evaluation từ development..." -ForegroundColor Yellow
try {
    psql $devUrl -f "export-evaluation-dev.sql"
    Write-Host "✅ Export thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi export dữ liệu" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 4: Xóa dữ liệu evaluation cũ trong production..." -ForegroundColor Green

# Xóa dữ liệu cũ
$clearScript = @"
-- Xóa dữ liệu evaluation cũ trong production
DELETE FROM "EvaluationOption";
DELETE FROM "EvaluationConfig";

-- Reset sequence
SELECT setval('"EvaluationConfig_id_seq"', 1, false);
SELECT setval('"EvaluationOption_id_seq"', 1, false);
"@

$clearScript | Out-File -FilePath "clear-prod-evaluation.sql" -Encoding UTF8
Write-Host "Xóa dữ liệu evaluation cũ trong production..." -ForegroundColor Yellow
try {
    psql $prodUrl -f "clear-prod-evaluation.sql"
    Write-Host "✅ Xóa dữ liệu cũ thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi xóa dữ liệu cũ" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 5: Import dữ liệu evaluation vào production..." -ForegroundColor Green

# Import vào prod
$importScript = @"
\copy "EvaluationConfig" FROM 'evaluation_configs_dev.csv' WITH CSV HEADER;
\copy "EvaluationOption" FROM 'evaluation_options_dev.csv' WITH CSV HEADER;

-- Cập nhật sequence
SELECT setval('"EvaluationConfig_id_seq"', (SELECT MAX(id) FROM "EvaluationConfig"));
SELECT setval('"EvaluationOption_id_seq"', (SELECT MAX(id) FROM "EvaluationOption"));
"@

$importScript | Out-File -FilePath "import-evaluation-prod.sql" -Encoding UTF8
Write-Host "Import dữ liệu evaluation vào production..." -ForegroundColor Yellow
try {
    psql $prodUrl -f "import-evaluation-prod.sql"
    Write-Host "✅ Import thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi import dữ liệu" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 6: Xác minh kết quả..." -ForegroundColor Green

# Kiểm tra kết quả
$verifyScript = @"
SELECT 
    'EvaluationConfig' as table_name, 
    COUNT(*) as count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM "EvaluationConfig"
UNION ALL
SELECT 
    'EvaluationOption', 
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
FROM "EvaluationOption"
ORDER BY table_name;

-- Kiểm tra chi tiết dữ liệu
SELECT 
    ec.type,
    ec.category,
    COUNT(eo.id) as option_count
FROM "EvaluationConfig" ec
LEFT JOIN "EvaluationOption" eo ON ec.id = eo.config_id
GROUP BY ec.type, ec.category
ORDER BY ec.type, ec.category;
"@

$verifyScript | Out-File -FilePath "verify-evaluation.sql" -Encoding UTF8
Write-Host "Xác minh dữ liệu evaluation trong production..." -ForegroundColor Yellow
try {
    psql $prodUrl -f "verify-evaluation.sql"
    Write-Host "✅ Xác minh thành công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi xác minh dữ liệu" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bước 7: Dọn dẹp file tạm..." -ForegroundColor Green
Remove-Item "check-dev-evaluation.sql" -ErrorAction SilentlyContinue
Remove-Item "backup-prod-evaluation.sql" -ErrorAction SilentlyContinue
Remove-Item "clear-prod-evaluation.sql" -ErrorAction SilentlyContinue
Remove-Item "export-evaluation-dev.sql" -ErrorAction SilentlyContinue
Remove-Item "import-evaluation-prod.sql" -ErrorAction SilentlyContinue
Remove-Item "verify-evaluation.sql" -ErrorAction SilentlyContinue
Remove-Item "evaluation_configs_dev.csv" -ErrorAction SilentlyContinue
Remove-Item "evaluation_options_dev.csv" -ErrorAction SilentlyContinue
Write-Host "✅ Dọn dẹp file tạm thành công" -ForegroundColor Green

Write-Host ""
Write-Host "✅ HOÀN THÀNH ĐỒNG BỘ DỮ LIỆU EVALUATION!" -ForegroundColor Green
Write-Host "Dữ liệu evaluation từ development đã được đồng bộ sang production" -ForegroundColor Green
Write-Host "Backup được lưu với timestamp: $timestamp" -ForegroundColor Green
Write-Host ""
Write-Host "Để kiểm tra dữ liệu:" -ForegroundColor Yellow
Write-Host "npx prisma studio --schema=src/prisma/schema.prisma" -ForegroundColor Cyan
Write-Host ""
Write-Host "Để khôi phục nếu cần:" -ForegroundColor Yellow
Write-Host "psql `"$prodUrl`" -c `"DELETE FROM \\\"EvaluationOption\\\"; DELETE FROM \\\"EvaluationConfig\\\"; INSERT INTO \\\"EvaluationConfig\\\" SELECT * FROM \\\"EvaluationConfig_backup_$timestamp\\\"; INSERT INTO \\\"EvaluationOption\\\" SELECT * FROM \\\"EvaluationOption_backup_$timestamp\\\";`"" -ForegroundColor Cyan
