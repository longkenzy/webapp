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

### **Chuyển sang Development:**
```powershell
.\to-dev.ps1
```

### **Chuyển sang Production:**
```powershell
.\to-prod.ps1
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






