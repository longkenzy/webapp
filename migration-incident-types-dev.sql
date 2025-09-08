-- =====================================================
-- MIGRATION SCRIPT: Tạo bảng IncidentType cho DEV
-- =====================================================
-- Mục đích: Tạo bảng IncidentType riêng để quản lý loại sự cố
-- Môi trường: DEV ONLY (không ảnh hưởng PROD)
-- An toàn: Không reset dữ liệu, không ảnh hưởng DB khác
-- =====================================================

-- 1. BACKUP DỮ LIỆU HIỆN CÓ (tùy chọn)
-- CREATE TABLE "Incident_backup" AS SELECT * FROM "Incident";

-- 2. TẠO BẢNG INCIDENTTYPE
CREATE TABLE IF NOT EXISTS "IncidentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncidentType_pkey" PRIMARY KEY ("id")
);

-- 3. TẠO UNIQUE CONSTRAINT TRÊN NAME
CREATE UNIQUE INDEX IF NOT EXISTS "IncidentType_name_key" ON "IncidentType"("name");

-- 4. THÊM DỮ LIỆU MẶC ĐỊNH
INSERT INTO "IncidentType" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES 
    ('clx0000000000000000000001', 'Vi phạm bảo mật', 'Các sự cố liên quan đến bảo mật hệ thống', true, NOW(), NOW()),
    ('clx0000000000000000000002', 'Lỗi hệ thống', 'Các lỗi kỹ thuật trong hệ thống', true, NOW(), NOW()),
    ('clx0000000000000000000003', 'Mất dữ liệu', 'Sự cố mất mát hoặc hỏng dữ liệu', true, NOW(), NOW()),
    ('clx0000000000000000000004', 'Sự cố mạng', 'Các vấn đề về kết nối mạng', true, NOW(), NOW()),
    ('clx0000000000000000000005', 'Lỗi phần cứng', 'Sự cố với thiết bị phần cứng', true, NOW(), NOW()),
    ('clx0000000000000000000006', 'Lỗi phần mềm', 'Các lỗi trong ứng dụng phần mềm', true, NOW(), NOW()),
    ('clx0000000000000000000007', 'Sự cố hiệu suất', 'Vấn đề về hiệu suất hệ thống', true, NOW(), NOW()),
    ('clx0000000000000000000008', 'Từ chối truy cập', 'Không thể truy cập vào hệ thống', true, NOW(), NOW()),
    ('clx0000000000000000000009', 'Khác', 'Các sự cố khác không thuộc danh mục trên', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- 5. THÊM CỘT INCIDENTTYPEID VÀO BẢNG INCIDENT
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "incidentTypeId" TEXT;

-- 6. CẬP NHẬT DỮ LIỆU HIỆN CÓ
-- Gán incidentTypeId cho các incidents hiện có dựa trên incidentType
UPDATE "Incident" 
SET "incidentTypeId" = (
    SELECT "id" 
    FROM "IncidentType" 
    WHERE "IncidentType"."name" = "Incident"."incidentType"
    LIMIT 1
)
WHERE "incidentType" IS NOT NULL 
  AND "incidentTypeId" IS NULL;

-- 7. GÁN "KHÁC" CHO CÁC INCIDENTS KHÔNG TÌM THẤY LOẠI
UPDATE "Incident" 
SET "incidentTypeId" = (
    SELECT "id" 
    FROM "IncidentType" 
    WHERE "name" = 'Khác'
    LIMIT 1
)
WHERE "incidentTypeId" IS NULL;

-- 8. TẠO FOREIGN KEY CONSTRAINT
ALTER TABLE "Incident" 
ADD CONSTRAINT IF NOT EXISTS "Incident_incidentTypeId_fkey" 
FOREIGN KEY ("incidentTypeId") REFERENCES "IncidentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. KIỂM TRA KẾT QUẢ
-- SELECT 'Migration completed successfully!' as status;
-- SELECT COUNT(*) as total_incident_types FROM "IncidentType";
-- SELECT COUNT(*) as total_incidents_with_type FROM "Incident" WHERE "incidentTypeId" IS NOT NULL;

-- =====================================================
-- LƯU Ý: 
-- - Script này chỉ chạy trên DEV environment
-- - Không xóa cột "incidentType" cũ để đảm bảo an toàn
-- - Có thể rollback bằng cách xóa cột "incidentTypeId" và bảng "IncidentType"
-- =====================================================
