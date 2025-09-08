# Hướng dẫn Migration Incident Types

## 🎯 Mục tiêu
Chuyển đổi từ việc lưu `incidentType` dưới dạng string sang sử dụng bảng `IncidentType` riêng để tối ưu hóa quản lý và hiệu năng.

## 📋 Các bước thực hiện

### 1. Backup Database
```bash
# Backup database trước khi migration
pg_dump your_database > backup_before_migration.sql
```

### 2. Chạy Migration Script
```bash
# Chạy script SQL migration
psql your_database < migration-incident-types.sql
```

### 3. Cập nhật Prisma Schema
```bash
# Generate Prisma client với schema mới
npx prisma generate

# Push schema changes to database
npx prisma db push
```

### 4. Kiểm tra dữ liệu
```sql
-- Kiểm tra bảng IncidentType đã được tạo
SELECT * FROM "IncidentType";

-- Kiểm tra incidents đã có incidentTypeId
SELECT id, title, "incidentTypeId", "incidentType" FROM "Incident" LIMIT 10;
```

### 5. Xóa cột cũ (tùy chọn)
```sql
-- Sau khi đã kiểm tra mọi thứ hoạt động tốt
ALTER TABLE "Incident" DROP COLUMN "incidentType";
```

## ✅ Lợi ích sau migration

### **Hiệu năng cao hơn:**
- Query nhanh hơn: `SELECT * FROM "IncidentType"` thay vì `SELECT DISTINCT incidentType FROM "Incident"`
- Index trên `name` field
- Không cần scan toàn bộ bảng incidents

### **Quản lý dễ dàng hơn:**
- Dữ liệu lưu vĩnh viễn trong database
- Có thể thêm metadata (description, isActive, createdAt)
- Đồng bộ giữa admin và user
- Backup/restore tự động

### **Mở rộng dễ dàng:**
- Có thể thêm fields mới cho incident types
- Quản lý trạng thái active/inactive
- Audit trail với createdAt/updatedAt

## 🔄 Rollback (nếu cần)

```sql
-- Khôi phục cột incidentType
ALTER TABLE "Incident" ADD COLUMN "incidentType" TEXT;

-- Cập nhật dữ liệu từ bảng IncidentType
UPDATE "Incident" 
SET "incidentType" = (
    SELECT "name" 
    FROM "IncidentType" 
    WHERE "IncidentType"."id" = "Incident"."incidentTypeId"
);

-- Xóa foreign key constraint
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_incidentTypeId_fkey";

-- Xóa cột incidentTypeId
ALTER TABLE "Incident" DROP COLUMN "incidentTypeId";

-- Xóa bảng IncidentType
DROP TABLE "IncidentType";
```

## 🚀 Sau khi migration

1. **Admin page** sẽ tự động sử dụng API mới
2. **User page** sẽ lấy incident types từ bảng mới
3. **Dữ liệu** được đồng bộ hoàn toàn
4. **Hiệu năng** được cải thiện đáng kể

## 📝 Lưu ý

- Migration script đã bao gồm dữ liệu mặc định
- Không ảnh hưởng đến dữ liệu incidents hiện có
- Có thể rollback nếu cần thiết
- Tất cả API endpoints đã được cập nhật
