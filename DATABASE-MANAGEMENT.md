# Database Management Guide

## 🎯 **Vấn đề đã giải quyết:**
Trước đây, tôi đã nhầm lẫn giữa database development và production, dẫn đến việc sửa đổi dữ liệu production khi bạn yêu cầu sửa development.

## 📊 **Cấu hình Database:**

### **Development Database:**
- **URL:** `ep-rapid-dream-a1b4rn5j`
- **Mục đích:** Phát triển và testing
- **Dữ liệu:** Có thể reset, thay đổi tự do

### **Production Database:**
- **URL:** `ep-broad-truth-a1v49nhu`
- **Mục đích:** Môi trường thực tế
- **Dữ liệu:** Cần cẩn thận, không được reset

## 🛠️ **Scripts quản lý:**

### **Chuyển môi trường:**
```powershell
# Chuyển sang Development
.\to-dev.ps1

# Chuyển sang Production
.\to-prod.ps1
```

### **Đồng bộ database:**
```powershell
# Kiểm tra trạng thái cả hai database
.\check-db-status.ps1

# Đồng bộ CHỈ SCHEMA từ production sang development (an toàn)
.\sync-dev-schema-only.ps1

# Đồng bộ SCHEMA + DỮ LIỆU từ production sang development (cẩn thận)
.\sync-dev-from-prod.ps1
```

### **Copy dữ liệu:**
```powershell
# Copy dữ liệu từ production sang development (đơn giản)
.\copy-prod-data-simple.ps1

# Copy dữ liệu từ production sang development (chi tiết)
.\copy-prod-data-to-dev.ps1
```

### **Kiểm tra database hiện tại:**
```powershell
.\check-db-simple.ps1
```

## ⚠️ **Lưu ý quan trọng:**

1. **Luôn kiểm tra database hiện tại** trước khi thực hiện bất kỳ thay đổi nào
2. **Development database** - có thể thay đổi tự do
3. **Production database** - cần cẩn thận, chỉ deploy khi đã test kỹ
4. **Môi trường hiện tại:** Development (ep-rapid-dream-a1b4rn5j)

## 🔄 **Quy trình làm việc:**

1. **Phát triển:** Sử dụng `.\to-dev.ps1` và làm việc trên development
2. **Testing:** Test kỹ trên development database
3. **Deploy:** Chỉ khi đã test xong, mới chuyển sang production
4. **Kiểm tra:** Luôn dùng `.\check-db-simple.ps1` để xác nhận môi trường

## 📋 **Trạng thái hiện tại:**
- ✅ **Development database:** Đã có đầy đủ dữ liệu khách hàng và nhân viên
- ✅ **Production database:** Đã đồng bộ với development
- ✅ **Scripts:** Đã tạo sẵn để quản lý dễ dàng

## 🔄 **Hướng dẫn đồng bộ Development từ Production:**

### **Bước 1: Kiểm tra trạng thái**
```powershell
.\check-db-status.ps1
```
Script này sẽ hiển thị:
- Schema của cả hai database
- Số lượng bản ghi trong mỗi bảng
- So sánh giữa development và production

### **Bước 2: Chọn phương thức đồng bộ**

#### **Option A: Chỉ đồng bộ Schema (Khuyến nghị)**
```powershell
.\sync-dev-schema-only.ps1
```
- ✅ An toàn 100%
- ✅ Giữ nguyên dữ liệu hiện có
- ✅ Chỉ cập nhật cấu trúc bảng
- ✅ Phù hợp khi production có schema mới

#### **Option B: Đồng bộ Schema + Dữ liệu**
```powershell
.\sync-dev-from-prod.ps1
```
- ⚠️ **CẢNH BÁO:** Sẽ thay thế toàn bộ dữ liệu development
- ⚠️ Tự động backup trước khi đồng bộ
- ⚠️ Cần xác nhận trước khi thực hiện
- ✅ Phù hợp khi muốn development giống hệt production

### **Bước 3: Xác minh kết quả**
```powershell
# Mở Prisma Studio để kiểm tra
npx prisma studio --schema=src/prisma/schema.prisma

# Hoặc kiểm tra lại trạng thái
.\check-db-status.ps1
```

## 📋 **Hướng dẫn Copy Dữ liệu từ Production sang Development:**

### **Bước 1: Kiểm tra trạng thái**
```powershell
.\check-db-status.ps1
```

### **Bước 2: Chọn phương thức copy**

#### **Option A: Copy đơn giản (Khuyến nghị)**
```powershell
.\copy-prod-data-simple.ps1
```
- ✅ Sử dụng pg_dump/pg_restore
- ✅ Tự động backup trước khi copy
- ✅ Có tùy chọn xóa dữ liệu cũ
- ✅ Nhanh và đơn giản

#### **Option B: Copy chi tiết**
```powershell
.\copy-prod-data-to-dev.ps1
```
- ✅ Export/import từng bảng riêng biệt
- ✅ Kiểm soát chi tiết từng bước
- ✅ Có thể tùy chỉnh quá trình
- ⚠️ Phức tạp hơn, cần nhiều thời gian

### **Bước 3: Xác minh kết quả**
```powershell
# Kiểm tra lại trạng thái
.\check-db-status.ps1

# Hoặc mở Prisma Studio
npx prisma studio --schema=src/prisma/schema.prisma
```

## 🚨 **Lưu ý quan trọng:**
1. **Luôn backup** trước khi copy dữ liệu
2. **Kiểm tra kỹ** script trước khi chạy
3. **Test trên development** trước khi deploy lên production
4. **Không bao giờ** chạy script copy trên production
5. **Xác nhận** trước khi xóa dữ liệu cũ
6. **Kiểm tra** kết quả sau khi copy






