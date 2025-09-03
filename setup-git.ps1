# Script khởi tạo Git repository và kết nối GitHub
# Chạy với quyền Administrator: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "🔧 Khởi tạo Git repository và kết nối GitHub..." -ForegroundColor Green

# Kiểm tra Git đã được cài đặt
try {
    $gitVersion = git --version
    Write-Host "✅ Git đã được cài đặt: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git chưa được cài đặt. Vui lòng cài đặt Git trước:" -ForegroundColor Red
    Write-Host "https://git-scm.com/downloads" -ForegroundColor Cyan
    exit 1
}

# Kiểm tra xem đã có Git repository chưa
if (Test-Path ".git") {
    Write-Host "⚠️ Git repository đã tồn tại!" -ForegroundColor Yellow
    $choice = Read-Host "Bạn có muốn khởi tạo lại không? (y/N)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Remove-Item -Recurse -Force ".git"
        Write-Host "🗑️ Đã xóa repository cũ" -ForegroundColor Green
    } else {
        Write-Host "✅ Giữ nguyên repository hiện tại" -ForegroundColor Green
        exit 0
    }
}

# Khởi tạo Git repository
Write-Host "📁 Đang khởi tạo Git repository..." -ForegroundColor Yellow
git init

# Thêm tất cả file
Write-Host "📝 Đang thêm file vào Git..." -ForegroundColor Yellow
git add .

# Commit đầu tiên
Write-Host "💾 Đang tạo commit đầu tiên..." -ForegroundColor Yellow
git commit -m "Initial commit: IT Web Management System"

# Nhập thông tin GitHub
Write-Host "🌐 Thiết lập kết nối GitHub:" -ForegroundColor Cyan
$username = Read-Host "Nhập GitHub username"
$repoName = Read-Host "Nhập tên repository"

# Thêm remote origin
Write-Host "🔗 Đang thêm remote origin..." -ForegroundColor Yellow
git remote add origin "https://github.com/$username/$repoName.git"

# Kiểm tra remote
try {
    $remoteUrl = git remote get-url origin
    Write-Host "✅ Remote origin: $remoteUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Không thể thêm remote origin" -ForegroundColor Red
    exit 1
}

# Hướng dẫn push
Write-Host "🎯 Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "1. Tạo repository '$repoName' trên GitHub.com" -ForegroundColor White
Write-Host "2. Chạy lệnh sau để push code:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "3. Sau đó chạy script deploy: .\deploy.ps1" -ForegroundColor White

Write-Host "🎉 Git repository đã được khởi tạo thành công!" -ForegroundColor Green
