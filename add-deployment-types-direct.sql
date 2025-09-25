-- Add new deployment types to production database
-- These are IT helpdesk, system, and network focused deployment types

INSERT INTO "DeploymentType" ("id", "name", "description", "createdAt", "updatedAt") VALUES
('deployment_type_9', 'Triển khai hệ thống', 'Cài đặt server, database', NOW(), NOW()),
('deployment_type_10', 'Triển khai mạng', 'Thiết lập LAN, WAN, VPN', NOW(), NOW()),
('deployment_type_11', 'Triển khai bảo mật', 'Firewall, antivirus, SSL', NOW(), NOW()),
('deployment_type_12', 'Triển khai backup', 'Sao lưu dữ liệu, hệ thống', NOW(), NOW()),
('deployment_type_13', 'Triển khai monitoring', 'Giám sát hệ thống, mạng', NOW(), NOW()),
('deployment_type_14', 'Triển khai user management', 'Quản lý người dùng, phân quyền', NOW(), NOW()),
('deployment_type_15', 'Triển khai email server', 'Hệ thống email nội bộ', NOW(), NOW()),
('deployment_type_16', 'Triển khai file server', 'Lưu trữ file, chia sẻ', NOW(), NOW()),
('deployment_type_17', 'Triển khai print server', 'Hệ thống in ấn', NOW(), NOW()),
('deployment_type_18', 'Triển khai remote access', 'Truy cập từ xa, remote desktop', NOW(), NOW()),
('deployment_type_19', 'Triển khai network security', 'Bảo mật mạng, access control', NOW(), NOW()),
('deployment_type_20', 'Triển khai system update', 'Cập nhật hệ thống, patch', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
