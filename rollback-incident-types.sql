-- =====================================================
-- ROLLBACK SCRIPT: Khôi phục về trạng thái trước migration
-- =====================================================
-- Mục đích: Rollback migration IncidentType về trạng thái ban đầu
-- Môi trường: DEV
-- Thời gian: Sau khi chạy migration-incident-types-dev.sql
-- =====================================================

-- 1. XÓA FOREIGN KEY CONSTRAINT
ALTER TABLE "Incident" DROP CONSTRAINT IF EXISTS "Incident_incidentTypeId_fkey";

-- 2. XÓA CỘT INCIDENTTYPEID
ALTER TABLE "Incident" DROP COLUMN IF EXISTS "incidentTypeId";

-- 3. XÓA BẢNG INCIDENTTYPE
DROP TABLE IF EXISTS "IncidentType";

-- 4. XÓA CÁC INDEX LIÊN QUAN
DROP INDEX IF EXISTS "IncidentType_name_key";

-- 5. KIỂM TRA KẾT QUẢ
SELECT 'Rollback completed successfully!' as status;
SELECT COUNT(*) as total_incidents FROM "Incident";

-- =====================================================
-- LƯU Ý:
-- - Script này sẽ xóa hoàn toàn bảng IncidentType
-- - Khôi phục về trạng thái trước khi migration
-- - Dữ liệu incidents gốc vẫn được giữ nguyên
-- - Chỉ chạy khi cần thiết và đã backup dữ liệu
-- =====================================================
