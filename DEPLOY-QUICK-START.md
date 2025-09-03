# 🚀 Deploy Nhanh lên Vercel - Quick Start

## 📋 Quy trình 3 bước đơn giản

### 🔧 Bước 1: Khởi tạo Git & GitHub
```bash
# Chạy script tự động
.\setup-git.ps1

# Hoặc làm thủ công:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 📤 Bước 2: Push code lên GitHub
```bash
# Chạy script tự động
.\deploy.ps1

# Script sẽ tự động:
# - Kiểm tra Git repository
# - Push code lên GitHub
# - Hướng dẫn bước tiếp theo
```

### 🌐 Bước 3: Deploy trên Vercel Dashboard
1. **Truy cập**: https://vercel.com/dashboard
2. **New Project** → Import Git Repository
3. **Chọn repository** của bạn
4. **Click Deploy** (Vercel tự động detect Next.js)
5. **Thiết lập Database** → Storage → Create Database
6. **Kết nối Domain** → Settings → Domains

## ⚡ Scripts có sẵn

- **`setup-git.ps1`** - Khởi tạo Git repository
- **`deploy.ps1`** - Push code lên GitHub
- **`README-DEPLOY.md`** - Hướng dẫn chi tiết đầy đủ

## 🎯 Lưu ý quan trọng

- ✅ **GitHub trước**: Phải push code lên GitHub trước
- ✅ **Database**: Sử dụng Vercel Postgres (tự động tích hợp)
- ✅ **Domain**: Cập nhật DNS records theo hướng dẫn Vercel
- ✅ **Auto-deploy**: Mỗi push sẽ tự động deploy

## 🆘 Nếu gặp lỗi

1. **Git lỗi**: Chạy `.\setup-git.ps1` để khởi tạo lại
2. **Build lỗi**: Kiểm tra logs trong Vercel Dashboard
3. **Database lỗi**: Kiểm tra DATABASE_URL trong Environment Variables
4. **Domain lỗi**: Đợi DNS propagation (24-48 giờ)

## 📖 Tài liệu chi tiết

Xem `README-DEPLOY.md` để biết thêm chi tiết về:
- Thiết lập database
- Kết nối domain
- Environment variables
- Database migration
- Troubleshooting
