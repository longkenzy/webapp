-- Seed default deployment types
INSERT INTO "DeploymentType" ("id", "name", "description", "isActive", "createdAt", "updatedAt") VALUES
('deployment_type_1', 'Triển khai phần mềm', 'Triển khai và cài đặt các phần mềm mới cho khách hàng', true, NOW(), NOW()),
('deployment_type_2', 'Cài đặt hệ thống', 'Cài đặt và cấu hình các hệ thống mới', true, NOW(), NOW()),
('deployment_type_3', 'Nâng cấp hạ tầng', 'Nâng cấp và cải thiện hạ tầng công nghệ thông tin', true, NOW(), NOW()),
('deployment_type_4', 'Tích hợp hệ thống', 'Tích hợp các hệ thống với nhau để hoạt động đồng bộ', true, NOW(), NOW()),
('deployment_type_5', 'Di chuyển dữ liệu', 'Di chuyển và chuyển đổi dữ liệu giữa các hệ thống', true, NOW(), NOW()),
('deployment_type_6', 'Triển khai cloud', 'Triển khai và cấu hình các dịch vụ cloud', true, NOW(), NOW()),
('deployment_type_7', 'Bảo mật hệ thống', 'Triển khai và cấu hình các giải pháp bảo mật', true, NOW(), NOW()),
('deployment_type_8', 'Tối ưu hóa hiệu suất', 'Tối ưu hóa và cải thiện hiệu suất hệ thống', true, NOW(), NOW());
