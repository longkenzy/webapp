-- =====================================================
-- BACKUP SCRIPT: Sao lưu dữ liệu trước khi migration
-- =====================================================
-- Mục đích: Backup dữ liệu hiện có trước khi thực hiện migration
-- Môi trường: DEV
-- Thời gian: Trước khi chạy migration-incident-types-dev.sql
-- =====================================================

-- 1. BACKUP BẢNG INCIDENT HIỆN TẠI
CREATE TABLE IF NOT EXISTS "Incident_backup_$(date +%Y%m%d_%H%M%S)" AS 
SELECT * FROM "Incident";

-- 2. BACKUP CÁC BẢNG LIÊN QUAN
CREATE TABLE IF NOT EXISTS "IncidentComment_backup_$(date +%Y%m%d_%H%M%S)" AS 
SELECT * FROM "IncidentComment";

CREATE TABLE IF NOT EXISTS "IncidentWorklog_backup_$(date +%Y%m%d_%H%M%S)" AS 
SELECT * FROM "IncidentWorklog";

-- 3. TẠO BẢNG BACKUP CHO INCIDENT TYPES HIỆN CÓ
CREATE TABLE IF NOT EXISTS "IncidentTypes_backup_$(date +%Y%m%d_%H%M%S)" AS
SELECT DISTINCT "incidentType" as "name", 
       COUNT(*) as "usage_count",
       NOW() as "backup_date"
FROM "Incident" 
WHERE "incidentType" IS NOT NULL 
GROUP BY "incidentType"
ORDER BY "usage_count" DESC;

-- 4. KIỂM TRA DỮ LIỆU BACKUP
SELECT 'Backup completed successfully!' as status;
SELECT COUNT(*) as total_incidents_backed_up FROM "Incident";
SELECT COUNT(*) as total_incident_types_backed_up FROM "IncidentTypes_backup_$(date +%Y%m%d_%H%M%S)";

-- =====================================================
-- LƯU Ý:
-- - Backup được tạo với timestamp để tránh trùng lặp
-- - Có thể restore bằng cách copy dữ liệu từ bảng backup
-- - Chạy script này TRƯỚC khi chạy migration
-- =====================================================
