# Hệ thống Quản lý Session

## Tổng quan

Hệ thống đã được cấu hình để tự động đăng xuất sau **1 giờ** (3600 giây) để đảm bảo bảo mật.

## Tính năng

### 1. Session Timer
- Hiển thị thời gian còn lại của session ở góc trên bên phải
- Format: `MM:SS` (phút:giây)

### 2. Cảnh báo trước khi hết hạn
- Hiển thị modal cảnh báo 5 phút trước khi session hết hạn
- Cho phép người dùng gia hạn session hoặc đăng xuất

### 3. Tự động đăng xuất
- Tự động đăng xuất khi session hết hạn
- Hiển thị modal thông báo session đã hết hạn
- Chuyển hướng về trang đăng nhập sau 5 giây

### 4. Gia hạn Session
- API endpoint: `/api/auth/extend-session`
- Cho phép gia hạn session mà không cần reload trang
- Cập nhật thời gian đăng nhập mới

## Cấu hình

### Session Options (src/lib/auth/options.ts)
```typescript
session: { 
  strategy: "jwt",
  maxAge: 60 * 60, // 1 hour (3600 seconds)
  updateAge: 60 * 60, // Update session every hour
},
jwt: {
  maxAge: 60 * 60, // 1 hour
},
```

### Cookie Settings
```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
    }
  },
},
```

## Cách sử dụng

### 1. Kiểm tra Session
Truy cập `/test-session` để xem thông tin chi tiết về session hiện tại.

### 2. Đăng xuất thủ công
- Truy cập `/logout` để đăng xuất
- Hoặc sử dụng nút logout trong giao diện

### 3. Gia hạn Session
- Khi thấy cảnh báo, nhấn "Gia hạn" để kéo dài session thêm 1 giờ
- Hoặc refresh trang để gia hạn session

## Components

### SessionTimer
- Hiển thị timer và modal cảnh báo
- Tự động gia hạn session khi cần

### SessionExpiredModal
- Hiển thị khi session đã hết hạn
- Tự động chuyển hướng về trang đăng nhập

## API Endpoints

### POST /api/auth/extend-session
Gia hạn session hiện tại.

**Response:**
```json
{
  "success": true,
  "message": "Session extended successfully",
  "newLoginTime": 1234567890
}
```

### POST /api/auth/logout
Xóa session và cookies.

**Response:**
```json
{
  "success": true
}
```

## Bảo mật

1. **Session timeout**: Tự động đăng xuất sau 1 giờ
2. **HTTP-only cookies**: Ngăn chặn XSS attacks
3. **Secure cookies**: Chỉ sử dụng HTTPS trong production
4. **SameSite**: Bảo vệ khỏi CSRF attacks

## Troubleshooting

### Session không hết hạn
1. Kiểm tra console logs để debug
2. Truy cập `/test-session` để xem thông tin session
3. Xóa cookies thủ công nếu cần

### Không thể gia hạn session
1. Kiểm tra API endpoint `/api/auth/extend-session`
2. Kiểm tra network tab trong DevTools
3. Thử refresh trang

### Timer không hiển thị
1. Kiểm tra SessionTimer component
2. Đảm bảo session có `loginTime`
3. Kiểm tra console logs
