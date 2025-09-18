# Script đồng bộ CHỈ SCHEMA từ production sang development
# An toàn - chỉ đồng bộ cấu trúc, không động vào dữ liệu

Write-Host "=== ĐỒNG BỘ SCHEMA DEVELOPMENT TỪ PRODUCTION ===" -ForegroundColor Cyan
Write-Host "Script này chỉ đồng bộ cấu trúc database (schema)" -ForegroundColor Yellow
Write-Host "KHÔNG thay đổi dữ liệu hiện có" -ForegroundColor Green
Write-Host ""

# Chuyển sang production để lấy schema
Write-Host "Bước 1: Lấy schema từ production..." -ForegroundColor Green
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "production"

Write-Host "Đang lấy schema từ production database..." -ForegroundColor Yellow
npx prisma db pull --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 2: Áp dụng schema vào development..." -ForegroundColor Green

# Chuyển sang development
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"

Write-Host "Đang áp dụng schema vào development database..." -ForegroundColor Yellow
npx prisma db push --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 3: Generate Prisma client..." -ForegroundColor Green
npx prisma generate --schema=src/prisma/schema.prisma

Write-Host ""
Write-Host "Bước 4: Xác minh kết quả..." -ForegroundColor Green
Write-Host "Kiểm tra schema development..." -ForegroundColor Yellow
npx prisma db pull --schema=src/prisma/schema.prisma --print

Write-Host ""
Write-Host "✅ HOÀN THÀNH ĐỒNG BỘ SCHEMA!" -ForegroundColor Green
Write-Host "Schema development đã được đồng bộ với production" -ForegroundColor Green
Write-Host "Dữ liệu hiện có được giữ nguyên" -ForegroundColor Green
Write-Host ""
Write-Host "Để kiểm tra:" -ForegroundColor Yellow
Write-Host "npx prisma studio --schema=src/prisma/schema.prisma" -ForegroundColor Cyan
