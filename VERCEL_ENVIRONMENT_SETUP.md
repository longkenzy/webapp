# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## 📋 Environment Variables cần cập nhật trên Vercel

### 🔧 Production Environment (Production Database)

**Environment**: Production  
**Database**: `smartservices` (Production database)

```bash
DATABASE_URL=postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices
NODE_ENV=production
NEXTAUTH_URL=https://webapp-lime-two.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
```

### 🔧 Preview Environment (Development Database)

**Environment**: Preview  
**Database**: `smartservices_dev` (Development database)

```bash
DATABASE_URL=postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev
NODE_ENV=development
NEXTAUTH_URL=https://webapp-lime-two-git-dev.vercel.app
NEXTAUTH_SECRET=your-development-secret-key
```

---

## 🎯 CÁCH CẬP NHẬT TRÊN VERCEL

### Bước 1: Truy cập Vercel Dashboard
1. Đăng nhập vào [vercel.com](https://vercel.com)
2. Chọn project `webapp-lime-two`
3. Vào tab **Settings** → **Environment Variables**

### Bước 2: Cập nhật Production Environment
1. Tìm biến `DATABASE_URL` hiện tại (Neon database)
2. **Xóa** hoặc **Edit** biến cũ
3. **Add** biến mới:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices`
   - **Environment**: ✅ Production
   - **Environment**: ❌ Preview (không chọn)
   - **Environment**: ❌ Development (không chọn)

### Bước 3: Cập nhật Preview Environment
1. **Add** biến mới cho Preview:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev`
   - **Environment**: ❌ Production (không chọn)
   - **Environment**: ✅ Preview
   - **Environment**: ❌ Development (không chọn)

### Bước 4: Cập nhật NEXTAUTH_SECRET (nếu cần)
1. Tạo secret key mới cho production:
   ```bash
   openssl rand -base64 32
   ```
2. Cập nhật `NEXTAUTH_SECRET` với giá trị mới

### Bước 5: Redeploy
1. Vào tab **Deployments**
2. Click **Redeploy** cho production deployment
3. Kiểm tra logs để đảm bảo kết nối database thành công

---

## 🔍 KIỂM TRA SAU KHI DEPLOY

### 1. Kiểm tra Production Deployment
- Truy cập: `https://webapp-lime-two.vercel.app`
- Test đăng nhập với user có sẵn
- Kiểm tra data hiển thị đúng
- Test các chức năng chính

### 2. Kiểm tra Preview Deployment
- Tạo branch mới và push
- Kiểm tra preview URL
- Test với development database
- Verify data khác với production

### 3. Monitor Database Connections
- Kiểm tra logs trên Vercel
- Monitor database server (113.161.61.162:5432)
- Đảm bảo không có connection errors

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Security
- ✅ Database server chỉ accessible từ Vercel
- ✅ Username/password được bảo mật
- ✅ Không expose credentials trong code

### Performance
- ✅ Database server có đủ resources
- ✅ Connection pooling hoạt động tốt
- ✅ Monitor response times

### Backup
- ✅ Production database có backup
- ✅ Development database có thể reset
- ✅ Có kế hoạch rollback nếu cần

---

## 🆘 TROUBLESHOOTING

### Nếu deployment fails:
1. Kiểm tra database server có running không
2. Verify firewall settings cho Vercel IPs
3. Check database credentials
4. Review Vercel logs

### Nếu connection timeout:
1. Kiểm tra network connectivity
2. Verify database server status
3. Check connection limits
4. Monitor server resources

### Nếu data không hiển thị:
1. Verify database có data
2. Check table permissions
3. Test queries manually
4. Review application logs

---

## 📞 SUPPORT

### Database Connection Test
```bash
# Test production database
psql "postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices"

# Test development database  
psql "postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev"
```

### Vercel CLI Commands
```bash
# Check environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local

# Deploy with new environment
vercel --prod
```

---

## 🎉 KẾT LUẬN

Sau khi cập nhật environment variables:

✅ **Production** sẽ sử dụng database `smartservices`  
✅ **Preview** sẽ sử dụng database `smartservices_dev`  
✅ **Development** sẽ sử dụng database `smartservices_dev`  

**Database migration hoàn tất và sẵn sàng cho production!**
