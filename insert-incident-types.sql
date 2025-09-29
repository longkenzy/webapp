-- SQL script to insert incident types into the database
-- This script uses INSERT ... ON CONFLICT to avoid duplicates

-- Insert incident types (will skip if already exists)
INSERT INTO "IncidentType" (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'Hardware', 'Hỏng PC, laptop, server, máy in, thiết bị ngoại vi.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Software', 'Lỗi hệ điều hành, ứng dụng, update, patch.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Network', 'Mất mạng LAN/WiFi/VPN, lỗi router, switch, firewall.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Account & Access', 'Quên mật khẩu, khóa tài khoản, lỗi phân quyền.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Email & Collaboration', 'Lỗi gửi/nhận mail, spam, Teams/Zoom/Outlook lỗi.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Printing & Peripheral', 'Lỗi in ấn, kẹt giấy, không share máy in, ngoại vi hỏng.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Security', 'Virus, malware, phishing, tấn công mạng, lộ dữ liệu.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Service Request', 'Cấp tài khoản, quyền truy cập, cài phần mềm, cấp thiết bị.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Problem', 'Sự cố lặp lại, cần phân tích nguyên nhân gốc rễ.', true, NOW(), NOW()),
    (gen_random_uuid(), 'Change', 'Thay đổi/nâng cấp phần mềm, hệ thống, cấu hình.', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Show the inserted incident types
SELECT id, name, description, "isActive" FROM "IncidentType" 
WHERE name IN (
    'Hardware', 'Software', 'Network', 'Account & Access', 
    'Email & Collaboration', 'Printing & Peripheral', 'Security', 
    'Service Request', 'Problem', 'Change'
)
ORDER BY name;
