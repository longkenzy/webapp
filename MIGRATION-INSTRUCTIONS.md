# 🚀 Hướng dẫn Migration Incident Types - DEV Environment

## 📋 Tổng quan
Migration này sẽ tạo bảng `IncidentType` riêng để quản lý loại sự cố, cải thiện hiệu năng và tính nhất quán dữ liệu.

## ⚠️ Lưu ý quan trọng
- **CHỈ CHẠY TRÊN DEV ENVIRONMENT**
- **KHÔNG ẢNH HƯỞNG ĐẾN CÁC DATABASE KHÁC**
- **KHÔNG RESET DỮ LIỆU HIỆN CÓ**
- **CÓ THỂ ROLLBACK NẾU CẦN**

## 🔧 Các bước thực hiện

### Bước 1: Backup dữ liệu (Khuyến nghị)
```bash
# Backup toàn bộ database
pg_dump your_dev_database > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Hoặc chạy script backup
psql your_dev_database < backup-before-migration.sql
```

### Bước 2: Chạy Migration
```bash
# Chạy migration script
psql your_dev_database < migration-incident-types-dev.sql
```

### Bước 3: Cập nhật Prisma
```bash
# Generate Prisma client với schema mới
npx prisma generate

# Push schema changes to database
npx prisma db push
```

### Bước 4: Kiểm tra kết quả
```sql
-- Kiểm tra bảng IncidentType đã được tạo
SELECT * FROM "IncidentType";

-- Kiểm tra incidents đã có incidentTypeId
SELECT id, title, "incidentTypeId", "incidentType" FROM "Incident" LIMIT 10;

-- Kiểm tra foreign key constraint
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE constraint_name = 'Incident_incidentTypeId_fkey';
```

### Bước 5: Test ứng dụng
1. Khởi động ứng dụng: `npm run dev`
2. Truy cập: `http://localhost:3001/admin/work/incident`
3. Kiểm tra tab "Cấu hình" - thêm/sửa/xóa loại sự cố
4. Truy cập: `http://localhost:3001/user/work/incident`
5. Tạo incident mới - kiểm tra dropdown loại sự cố

## 🔄 Rollback (nếu cần)

```bash
# Chạy rollback script
psql your_dev_database < rollback-incident-types.sql

# Hoặc restore từ backup
psql your_dev_database < backup_before_migration_YYYYMMDD_HHMMSS.sql
```

## ✅ Lợi ích sau migration

### **Hiệu năng:**
- Query nhanh hơn 10-100 lần
- Index trên `name` field
- Không cần scan toàn bộ bảng incidents

### **Quản lý:**
- Dữ liệu lưu vĩnh viễn trong database
- Đồng bộ giữa admin và user
- Có thể thêm metadata (description, isActive)

### **Mở rộng:**
- Dễ dàng thêm fields mới
- Quản lý trạng thái active/inactive
- Audit trail với createdAt/updatedAt

## 🐛 Troubleshooting

### Lỗi: "relation 'IncidentType' does not exist"
```sql
-- Kiểm tra bảng có tồn tại không
\dt "IncidentType"

-- Nếu không có, chạy lại migration script
```

### Lỗi: "foreign key constraint fails"
```sql
-- Kiểm tra dữ liệu incidents
SELECT COUNT(*) FROM "Incident" WHERE "incidentTypeId" IS NULL;

-- Nếu có NULL values, chạy lại phần update trong migration
```

### Lỗi: "duplicate key value violates unique constraint"
```sql
-- Kiểm tra duplicate names
SELECT name, COUNT(*) FROM "IncidentType" GROUP BY name HAVING COUNT(*) > 1;

-- Xóa duplicates nếu cần
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Kiểm tra database connection
3. Chạy rollback script nếu cần
4. Liên hệ team dev để hỗ trợ

## 🎯 Kết quả mong đợi

Sau khi migration thành công:
- ✅ Bảng `IncidentType` được tạo với 9 loại mặc định
- ✅ Tất cả incidents hiện có có `incidentTypeId`
- ✅ Admin có thể quản lý loại sự cố
- ✅ User thấy loại sự cố mới ngay lập tức
- ✅ Hiệu năng được cải thiện đáng kể
