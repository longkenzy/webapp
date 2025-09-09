-- Insert default incident types if they don't exist
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

