# Hướng dẫn Deploy Project trên Coolify

## Tổng quan
Project này đã được chuẩn bị để deploy trên Coolify với Docker containers. Coolify sẽ tự động build và deploy ứng dụng Next.js của bạn.

## Files đã chuẩn bị

### 1. Dockerfile
- Multi-stage build để tối ưu kích thước image
- Sử dụng Node.js 18 Alpine
- Tự động generate Prisma client
- Standalone output cho Next.js

### 2. docker-compose.yml
- Cấu hình cho production environment
- Bao gồm PostgreSQL database
- Redis cho caching (nếu cần)
- Network isolation

### 3. .dockerignore
- Loại bỏ các file không cần thiết khỏi Docker build context
- Tối ưu thời gian build và kích thước image

### 4. next.config.ts
- Đã enable `output: 'standalone'` cho Docker deployment

## Các bước deploy trên Coolify

### Bước 1: Chuẩn bị Coolify Server
1. Cài đặt Coolify trên server của bạn
2. Truy cập Coolify dashboard
3. Tạo project mới

### Bước 2: Kết nối Git Repository
1. Trong Coolify dashboard, chọn "New Resource"
2. Chọn "Application"
3. Kết nối với Git repository của bạn
4. Chọn branch để deploy (thường là `main` hoặc `production`)

### Bước 3: Cấu hình Environment Variables
Thêm các environment variables sau trong Coolify:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database_name
POSTGRES_DB=it_web
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=https://your-domain.com

# Node Environment
NODE_ENV=production
```

### Bước 4: Cấu hình Build Settings
Trong Coolify, đảm bảo các settings sau:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Port**: `3000`
- **Dockerfile**: Sử dụng Dockerfile trong root directory

### Bước 5: Database Setup
1. Trong Coolify, tạo PostgreSQL database service
2. Sử dụng environment variables đã cấu hình ở bước 3
3. Chạy migrations sau khi deploy:

```bash
# Trong Coolify terminal hoặc SSH vào container
npx prisma migrate deploy --schema src/prisma/schema.prisma
```

### Bước 6: Deploy
1. Click "Deploy" trong Coolify dashboard
2. Coolify sẽ tự động:
   - Clone repository
   - Build Docker image
   - Start containers
   - Setup networking

## Post-deployment Tasks

### 1. Chạy Database Migrations
```bash
npx prisma migrate deploy --schema src/prisma/schema.prisma
```

### 2. Seed Database (nếu cần)
```bash
npx prisma db seed --schema src/prisma/schema.prisma
```

### 3. Kiểm tra Health
- Truy cập ứng dụng qua domain được cấu hình
- Kiểm tra logs trong Coolify dashboard
- Verify database connection

## Monitoring và Maintenance

### 1. Logs
- Xem logs trong Coolify dashboard
- SSH vào container nếu cần debug

### 2. Updates
- Push code mới lên Git repository
- Coolify sẽ tự động detect và rebuild
- Hoặc manually trigger rebuild từ dashboard

### 3. Backups
- Cấu hình database backup trong Coolify
- Backup file uploads (avatars, templates) nếu cần

## Troubleshooting

### Common Issues

1. **Build Failed**
   - Kiểm tra logs trong Coolify
   - Verify Dockerfile syntax
   - Check dependencies trong package.json

2. **Database Connection Error**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Verify network connectivity

3. **App Won't Start**
   - Check environment variables
   - Verify port configuration
   - Check application logs

### Useful Commands

```bash
# SSH vào container
docker exec -it <container_name> /bin/sh

# Check logs
docker logs <container_name>

# Restart service
# Trong Coolify dashboard, click restart
```

## Security Considerations

1. **Environment Variables**
   - Không commit sensitive data vào Git
   - Sử dụng Coolify's environment variables
   - Rotate secrets định kỳ

2. **Database Security**
   - Sử dụng strong passwords
   - Enable SSL connections
   - Restrict network access

3. **Application Security**
   - Keep dependencies updated
   - Use HTTPS
   - Configure proper CORS

## Performance Optimization

1. **Docker Image**
   - Multi-stage build đã được cấu hình
   - Alpine images để giảm kích thước

2. **Next.js**
   - Standalone output enabled
   - Bundle optimization configured
   - Image optimization enabled

3. **Database**
   - Connection pooling
   - Query optimization
   - Proper indexing

## Support

Nếu gặp vấn đề trong quá trình deploy:
1. Kiểm tra Coolify documentation
2. Xem logs chi tiết
3. Verify configuration
4. Test locally với Docker Compose trước khi deploy
