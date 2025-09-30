-- Seed default warranty types
INSERT INTO "WarrantyType" ("id", "name", "description", "isActive", "createdAt", "updatedAt") VALUES
('warranty_type_1', 'Bảo hành phần cứng', 'Bảo hành và sửa chữa các thiết bị phần cứng', true, NOW(), NOW()),
('warranty_type_2', 'Bảo hành phần mềm', 'Bảo hành và hỗ trợ các phần mềm', true, NOW(), NOW()),
('warranty_type_3', 'Bảo hành dịch vụ', 'Bảo hành và hỗ trợ các dịch vụ IT', true, NOW(), NOW()),
('warranty_type_4', 'Bảo hành mở rộng', 'Bảo hành mở rộng cho các sản phẩm và dịch vụ', true, NOW(), NOW()),
('warranty_type_5', 'Bảo hành thay thế', 'Thay thế các thiết bị hư hỏng trong thời gian bảo hành', true, NOW(), NOW()),
('warranty_type_6', 'Bảo hành sửa chữa', 'Sửa chữa và bảo trì các thiết bị', true, NOW(), NOW());
