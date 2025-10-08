# Database Sync Script

## 📋 Mô tả
Script này sẽ đồng bộ toàn bộ dữ liệu từ database `smartservices` sang database PostgreSQL trên Coolify một cách an toàn.

## 🛡️ Đảm bảo an toàn
- ✅ **Database gốc (smartservices)**: KHÔNG bị thay đổi gì (chỉ đọc)
- ✅ **Database Coolify**: Được cập nhật với dữ liệu từ database gốc
- ✅ **Backup tự động**: Tạo file backup trước khi sync
- ✅ **Log chi tiết**: Ghi lại toàn bộ quá trình

## 🚀 Cách sử dụng

### Windows:
1. **Chạy file batch:**
   ```
   run_sync.bat
   ```

2. **Hoặc chạy trực tiếp trong WSL:**
   ```bash
   wsl bash sync_databases.sh
   ```

### Linux/Mac:
1. **Cấp quyền thực thi:**
   ```bash
   chmod +x sync_databases.sh
   ```

2. **Chạy script:**
   ```bash
   ./sync_databases.sh
   ```

## 📋 Yêu cầu hệ thống

### Windows:
- WSL (Windows Subsystem for Linux)
- PostgreSQL client tools trong WSL

### Linux/Mac:
- PostgreSQL client tools (pg_dump, psql)

## 🔧 Cài đặt PostgreSQL client tools

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql-client
```

### CentOS/RHEL:
```bash
sudo yum install postgresql
```

### macOS:
```bash
brew install postgresql
```

## 📊 Thông tin database

### Source (Database gốc - KHÔNG ĐỘNG VÀO):
```
Host: 113.161.61.162:5432
Database: smartservices
User: smartservices
Password: Longkenzy@7525
```

### Target (Database Coolify - SẼ ĐƯỢC ĐỒNG BỘ):
```
Host: 113.161.61.162:7525
Database: postgres
User: postgres
Password: svpS7Fa83ELXyzOnTNAu3723SU7y5Tqt4RmX4xKEuKHeKcJC57U56xPDCBz9oOLG
```

## 📁 Files được tạo

### Sau khi chạy script:
- `smartservices_backup_YYYYMMDD_HHMMSS.sql` - File backup
- `sync_log_YYYYMMDD_HHMMSS.log` - File log chi tiết

## 🔍 Kiểm tra kết quả

### 1. Xem log file:
```bash
cat sync_log_*.log
```

### 2. Kiểm tra database Coolify:
```bash
psql -h 113.161.61.162 -p 7525 -U postgres -d postgres
```

### 3. Kiểm tra tables:
```sql
\dt
```

### 4. Kiểm tra data:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM cases;
```

## ⚠️ Lưu ý quan trọng

1. **Backup tự động**: Script tự động tạo backup trước khi sync
2. **Không ảnh hưởng source**: Database gốc chỉ được đọc, không bị thay đổi
3. **Log chi tiết**: Mọi thao tác đều được ghi log
4. **Rollback**: Có thể restore từ backup file nếu cần

## 🆘 Troubleshooting

### Lỗi kết nối:
- Kiểm tra network connectivity
- Verify username/password
- Check firewall rules

### Lỗi permission:
- Đảm bảo user có quyền đọc source database
- Đảm bảo user có quyền ghi target database

### Lỗi WSL (Windows):
- Cài đặt WSL: `wsl --install`
- Restart computer sau khi cài WSL
- Cài PostgreSQL client trong WSL

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log file để xem lỗi chi tiết
2. Verify database connections
3. Check system requirements
4. Contact support nếu cần thiết

## 🎯 Kết quả mong đợi

Sau khi chạy script thành công:
- ✅ Database Coolify có đầy đủ tables từ database gốc
- ✅ Database Coolify có đầy đủ data từ database gốc
- ✅ Database gốc không bị thay đổi gì
- ✅ Có thể cập nhật DATABASE_URL trong ứng dụng
- ✅ Ứng dụng có thể hoạt động với database Coolify
