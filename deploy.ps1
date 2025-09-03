# Script deploy tự động lên Vercel
# Chạy với quyền Administrator: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "🚀 Bắt đầu quy trình deploy lên Vercel..." -ForegroundColor Green

# Kiểm tra Git
try {
    $gitStatus = git status
    Write-Host "✅ Git repository đã được khởi tạo" -ForegroundColor Green
} catch {
    Write-Host "❌ Git repository chưa được khởi tạo. Đang khởi tạo..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: IT Web Management System"
    Write-Host "⚠️ Vui lòng thêm remote origin và push lên GitHub trước khi tiếp tục" -ForegroundColor Red
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
    exit 1
}

# Kiểm tra remote origin
try {
    $remoteUrl = git remote get-url origin
    Write-Host "✅ Remote origin: $remoteUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Chưa có remote origin. Vui lòng thêm trước:" -ForegroundColor Red
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git" -ForegroundColor Cyan
    exit 1
}

# Push code lên GitHub
Write-Host "📤 Đang push code lên GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Update: Prepare for Vercel deployment"
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push lên GitHub thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Push lên GitHub thất bại!" -ForegroundColor Red
    exit 1
}

# Kiểm tra Vercel CLI
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI đã được cài đặt: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI chưa được cài đặt. Đang cài đặt..." -ForegroundColor Yellow
    npm install -g vercel
}

# Kiểm tra đăng nhập
try {
    $user = vercel whoami
    Write-Host "✅ Đã đăng nhập với: $user" -ForegroundColor Green
} catch {
    Write-Host "🔐 Vui lòng đăng nhập Vercel..." -ForegroundColor Yellow
    vercel login
}

# Build project
Write-Host "🔨 Đang build project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Build thất bại!" -ForegroundColor Red
    exit 1
}

Write-Host "🎯 Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "1. Truy cập https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Click 'New Project'" -ForegroundColor White
Write-Host "3. Import Git Repository từ GitHub" -ForegroundColor White
Write-Host "4. Chọn repository của bạn" -ForegroundColor White
Write-Host "5. Click 'Deploy'" -ForegroundColor White

Write-Host "🎉 Code đã được push lên GitHub và sẵn sàng deploy!" -ForegroundColor Green
Write-Host "📖 Làm theo hướng dẫn chi tiết trong README-DEPLOY.md" -ForegroundColor Cyan
