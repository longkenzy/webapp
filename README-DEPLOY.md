# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị dự án

### 1.1 Cài đặt Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Đăng nhập Vercel
```bash
vercel login
```

## Bước 2: Thiết lập Database

### 2.1 Tạo database trên Vercel Postgres
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project → Storage → Create Database
3. Chọn PostgreSQL
4. Chọn region gần nhất (khuyến nghị: Singapore - sin1)
5. Tạo database và ghi nhớ thông tin kết nối

### 2.2 Cập nhật DATABASE_URL
Sau khi tạo database, Vercel sẽ tự động thêm biến môi trường `DATABASE_URL` vào project.

## Bước 3: Push code lên GitHub

### 3.1 Khởi tạo Git repository (nếu chưa có)
```bash
# Khởi tạo Git repository
git init

# Thêm tất cả file
git add .

# Commit đầu tiên
git commit -m "Initial commit: IT Web Management System"

# Thêm remote origin (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push lên GitHub
git push -u origin main
```

### 3.2 Cập nhật code (nếu đã có repository)
```bash
# Thêm các file mới
git add .

# Commit thay đổi
git commit -m "Add Vercel deployment configuration"

# Push lên GitHub
git push
```

## Bước 4: Kết nối GitHub với Vercel

### 4.1 Import project từ GitHub
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Chọn "Import Git Repository"
4. Chọn repository của bạn từ danh sách
5. Click "Import"

### 4.2 Cấu hình project
1. **Project Name**: Đặt tên cho project (ví dụ: it-web)
2. **Framework Preset**: Next.js (sẽ tự động detect)
3. **Root Directory**: Để trống (nếu code ở root)
4. **Build Command**: `npm run build` (tự động detect)
5. **Output Directory**: `.next` (tự động detect)
6. **Install Command**: `npm install` (tự động detect)

### 4.3 Deploy lần đầu
1. Click "Deploy"
2. Vercel sẽ tự động build và deploy project
3. Sau khi hoàn thành, bạn sẽ có URL dạng: `https://your-project.vercel.app`

## Bước 5: Thiết lập Database

### 5.1 Tạo database trên Vercel Postgres
1. Trong Vercel Dashboard → Project → Storage → Create Database
2. Chọn PostgreSQL
3. Chọn region gần nhất (khuyến nghị: Singapore - sin1)
4. Tạo database và ghi nhớ thông tin kết nối

### 5.2 Cập nhật DATABASE_URL
Sau khi tạo database, Vercel sẽ tự động thêm biến môi trường `DATABASE_URL` vào project.

## Bước 6: Thiết lập biến môi trường

Trong Vercel Dashboard → Project → Settings → Environment Variables, thêm:

```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here
```

## Bước 7: Kết nối tên miền

### 7.1 Thêm tên miền vào Vercel
1. Vào Vercel Dashboard → Project → Settings → Domains
2. Click "Add Domain"
3. Nhập tên miền của bạn (ví dụ: example.com)

### 7.2 Cập nhật DNS records
Vercel sẽ cung cấp các DNS records cần thêm vào domain provider:

**Type A:**
- Name: @
- Value: 76.76.19.0

**Type CNAME:**
- Name: www
- Value: cname.vercel-dns.com

### 7.3 Cập nhật NEXTAUTH_URL
Sau khi kết nối domain thành công, cập nhật:
```
NEXTAUTH_URL=https://your-domain.com
```

## Bước 8: Chạy database migration

### 8.1 Kết nối database
```bash
vercel env pull .env.local
```

### 8.2 Chạy migration
```bash
npm run prisma:deploy
```

## Bước 9: Kiểm tra và test

1. Truy cập website qua domain
2. Test các chức năng chính
3. Kiểm tra logs trong Vercel Dashboard

## Bước 10: Tự động deploy (Optional)

### 10.1 Kích hoạt auto-deploy
- Mỗi khi bạn push code lên GitHub, Vercel sẽ tự động deploy
- Bạn có thể cấu hình branch nào sẽ trigger deploy

### 10.2 Preview deployments
- Mỗi Pull Request sẽ tạo preview deployment
- Giúp test thay đổi trước khi merge vào main branch

## Bước 4: Thiết lập biến môi trường

Trong Vercel Dashboard → Project → Settings → Environment Variables, thêm:

```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here
```

## Bước 5: Kết nối tên miền

### 5.1 Thêm tên miền vào Vercel
1. Vào Vercel Dashboard → Project → Settings → Domains
2. Click "Add Domain"
3. Nhập tên miền của bạn (ví dụ: example.com)

### 5.2 Cập nhật DNS records
Vercel sẽ cung cấp các DNS records cần thêm vào domain provider:

**Type A:**
- Name: @
- Value: 76.76.19.0

**Type CNAME:**
- Name: www
- Value: cname.vercel-dns.com

### 5.3 Cập nhật NEXTAUTH_URL
Sau khi kết nối domain thành công, cập nhật:
```
NEXTAUTH_URL=https://your-domain.com
```

## Bước 6: Chạy database migration

### 6.1 Kết nối database
```bash
vercel env pull .env.local
```

### 6.2 Chạy migration
```bash
npm run prisma:deploy
```

## Bước 7: Kiểm tra và test

1. Truy cập website qua domain
2. Test các chức năng chính
3. Kiểm tra logs trong Vercel Dashboard

## Troubleshooting

### Lỗi database connection
- Kiểm tra DATABASE_URL trong Environment Variables
- Đảm bảo database đã được tạo và active

### Lỗi build
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả dependencies đã được cài đặt

### Lỗi domain
- Đợi DNS propagation (có thể mất 24-48 giờ)
- Kiểm tra DNS records đã được cập nhật đúng

## Lưu ý quan trọng

1. **Database**: Sử dụng Vercel Postgres để tối ưu performance
2. **Region**: Chọn region gần nhất với người dùng
3. **Environment Variables**: Không commit file .env vào git
4. **Secrets**: Sử dụng Vercel Secrets cho thông tin nhạy cảm
5. **Monitoring**: Sử dụng Vercel Analytics để theo dõi performance
