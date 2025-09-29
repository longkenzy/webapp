# Đồng Bộ Dữ Liệu EvaluationOption từ Dev sang Production

## 📋 Mô tả
Script này giúp đồng bộ dữ liệu từ bảng `EvaluationOption` từ database development sang database production một cách an toàn, không ảnh hưởng đến dữ liệu khác.

## 🚀 Các Script Có Sẵn

### 1. `sync-evaluation-option-dev-to-prod.ps1` (Khuyến nghị)
- **Mô tả**: Script PowerShell hoàn chỉnh với backup và khôi phục
- **Tính năng**: 
  - Tạo backup trước khi đồng bộ
  - Kiểm tra dữ liệu trước và sau
  - Xác minh kết quả
  - Dọn dẹp file tạm
- **Sử dụng**: `.\sync-evaluation-option-dev-to-prod.ps1`

### 2. `sync-evaluation-option-direct.sql`
- **Mô tả**: Script SQL trực tiếp
- **Tính năng**: 
  - Chạy trực tiếp trên database
  - Không cần PowerShell
- **Sử dụng**: `psql $prodUrl -f sync-evaluation-option-direct.sql`

## 🔧 Cách Sử Dụng

### Bước 1: Chuẩn bị
```powershell
# Đảm bảo có quyền truy cập database
# Kiểm tra kết nối
$devUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

psql $devUrl -c "SELECT 1;"
psql $prodUrl -c "SELECT 1;"
```

### Bước 2: Chạy Script
```powershell
# Chạy script hoàn chỉnh (khuyến nghị)
.\sync-evaluation-option-dev-to-prod.ps1

# Hoặc chạy script SQL trực tiếp
psql $prodUrl -f sync-evaluation-option-direct.sql
```

### Bước 3: Kiểm tra Kết quả
```powershell
# Kiểm tra dữ liệu trong production
psql $prodUrl -c "SELECT COUNT(*) FROM \"EvaluationOption\";"
```

## 🛡️ An Toàn

### Backup Tự Động
- Script tự động tạo backup trước khi đồng bộ
- Backup được lưu với timestamp: `EvaluationOption_backup_YYYYMMDD_HHMMSS`
- Backup được lưu trong cùng database production

### Khôi Phục Nếu Cần
```sql
-- Xóa dữ liệu hiện tại
DELETE FROM "EvaluationOption";

-- Khôi phục từ backup
INSERT INTO "EvaluationOption" SELECT id, config_id, label, points, "order", is_active, created_at, updated_at FROM "EvaluationOption_backup_YYYYMMDD_HHMMSS";

-- Xóa backup
DROP TABLE "EvaluationOption_backup_YYYYMMDD_HHMMSS";
```

## 📊 Kiểm Tra Dữ Liệu

### Kiểm tra Số Lượng
```sql
SELECT 
    'EvaluationOption' as table_name, 
    COUNT(*) as count
FROM "EvaluationOption";
```

### Kiểm tra Chi Tiết
```sql
SELECT 
    ec.type,
    ec.category,
    COUNT(eo.id) as option_count
FROM "EvaluationConfig" ec
LEFT JOIN "EvaluationOption" eo ON ec.id = eo.config_id
GROUP BY ec.type, ec.category
ORDER BY ec.type, ec.category;
```

## 🔍 Troubleshooting

### Lỗi Thường Gặp

1. **Lỗi kết nối database**
   - Kiểm tra URL database
   - Kiểm tra quyền truy cập
   - Kiểm tra kết nối mạng

2. **Lỗi foreign key constraint**
   - Script tự động xóa theo thứ tự đúng
   - Nếu vẫn lỗi, kiểm tra dữ liệu có bị lỗi không

3. **Lỗi import CSV**
   - Kiểm tra file CSV có tồn tại không
   - Kiểm tra format dữ liệu
   - Kiểm tra encoding file

### Khôi Phục Từ Backup
```powershell
# Tìm backup gần nhất
psql $prodUrl -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'EvaluationOption_backup_%';"

# Khôi phục từ backup
psql $prodUrl -c "DELETE FROM \"EvaluationOption\"; INSERT INTO \"EvaluationOption\" SELECT id, config_id, label, points, \"order\", is_active, created_at, updated_at FROM \"EvaluationOption_backup_YYYYMMDD_HHMMSS\";"
```

## 📝 Lưu Ý

- **Không reset database**: Script chỉ đồng bộ bảng EvaluationOption
- **Không ảnh hưởng dữ liệu khác**: Chỉ tác động đến `EvaluationOption`
- **Backup tự động**: Luôn có backup trước khi thay đổi
- **Khôi phục dễ dàng**: Có thể khôi phục từ backup bất kỳ lúc nào

## 🎯 Kết Quả Mong Đợi

Sau khi chạy script thành công:
- Dữ liệu `EvaluationOption` từ dev được copy sang production
- Tất cả dữ liệu khác trong production không bị ảnh hưởng
- Có backup để khôi phục nếu cần

## 🔄 So Sánh với Script Đồng Bộ Khác

| Script | Phạm Vi | Backup | Khôi Phục | Khuyến Nghị |
|--------|---------|--------|-----------|-------------|
| `sync-evaluation-complete.ps1` | EvaluationConfig + EvaluationOption | ✅ | ✅ | Cho đồng bộ toàn bộ |
| `sync-evaluation-option-dev-to-prod.ps1` | Chỉ EvaluationOption | ✅ | ✅ | Cho đồng bộ riêng lẻ |
| `sync-evaluation-option-direct.sql` | Chỉ EvaluationOption | ✅ | ✅ | Cho chạy SQL trực tiếp |
