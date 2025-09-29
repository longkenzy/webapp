# 📁 Tổng Quan Scripts trong Project

## 🗂️ Cấu Trúc Scripts Sau Khi Dọn Dẹp

### 🔧 Database Management Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `setup-db-dev.ps1` | Thiết lập database development | `.\setup-db-dev.ps1` |
| `setup-db-prod.ps1` | Thiết lập database production | `.\setup-db-prod.ps1` |
| `prisma-dev.ps1` | Chạy Prisma commands trên dev | `.\prisma-dev.ps1` |
| `prisma-prod.ps1` | Chạy Prisma commands trên prod | `.\prisma-prod.ps1` |
| `check-db-status.ps1` | Kiểm tra trạng thái database | `.\check-db-status.ps1` |
| `check-dev-data.ps1` | Kiểm tra dữ liệu development | `.\check-dev-data.ps1` |

### 🔄 Data Synchronization Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `sync-evaluation-complete.ps1` | Đồng bộ toàn bộ evaluation data | `.\sync-evaluation-complete.ps1` |
| `sync-evaluation-option-dev-to-prod.ps1` | Đồng bộ chỉ EvaluationOption | `.\sync-evaluation-option-dev-to-prod.ps1` |
| `copy-prod-data-to-dev.ps1` | Copy dữ liệu từ prod sang dev | `.\copy-prod-data-to-dev.ps1` |

### 🚀 Deployment Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `deploy.ps1` | Deploy chung | `.\deploy.ps1` |
| `deploy-prod.ps1` | Deploy production | `.\deploy-prod.ps1` |
| `update-prod-db.ps1` | Cập nhật database production | `.\update-prod-db.ps1` |

### ⚙️ Environment Setup Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `setup-env.ps1` | Thiết lập môi trường | `.\setup-env.ps1` |
| `setup-git.ps1` | Thiết lập Git repository | `.\setup-git.ps1` |
| `to-dev.ps1` | Chuyển sang môi trường dev | `.\to-dev.ps1` |
| `to-prod.ps1` | Chuyển sang môi trường prod | `.\to-prod.ps1` |

### 📊 Data Management Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `add-deployment-types-prod.ps1` | Thêm deployment types | `.\add-deployment-types-prod.ps1` |
| `seed-prod-reference-data.ps1` | Seed dữ liệu tham chiếu | `.\seed-prod-reference-data.ps1` |

### 📄 SQL Scripts
| Script | Mục đích | Sử dụng |
|--------|----------|---------|
| `add-deployment-types-prod.sql` | SQL thêm deployment types | `psql $prodUrl -f add-deployment-types-prod.sql` |
| `insert-default-incident-types.sql` | SQL thêm incident types | `psql $prodUrl -f insert-default-incident-types.sql` |
| `rollback-incident-types.sql` | SQL rollback incident types | `psql $prodUrl -f rollback-incident-types.sql` |

## 🧹 Files Đã Xóa (Trùng Lặp)

### PowerShell Scripts
- ❌ `sync-evaluation-data-dev-to-prod.ps1` (trùng với complete)
- ❌ `sync-evaluation-final.ps1` (trùng với complete)
- ❌ `sync-evaluation-fixed.ps1` (trùng với complete)
- ❌ `sync-evaluation-simple.ps1` (trùng với complete)
- ❌ `sync-evaluation-simple-fixed.ps1` (trùng với complete)
- ❌ `copy-prod-data-simple.ps1` (trùng với copy-prod-data-to-dev.ps1)

### SQL Scripts
- ❌ `sync-evaluation-data.sql` (trùng với complete)
- ❌ `sync-evaluation-direct.sql` (trùng với complete)
- ❌ `sync-evaluation-option-direct.sql` (trùng với PowerShell version)
- ❌ `add-deployment-types-direct.sql` (trùng với prod version)

### JavaScript Files
- ❌ `sync-evaluation-prisma.js` (trùng với PowerShell version)
- ❌ `add-deployment-types-final.js` (trùng với PowerShell version)

### Documentation Files
- ❌ `DEPLOY-QUICK-START.md` (trùng với README-DEPLOY.md)
- ❌ `SYNC-EVALUATION-README.md` (trùng với SYNC-EVALUATION-OPTION-README.md)

## 📋 Quy Trình Sử Dụng

### 1. Thiết Lập Môi Trường
```powershell
# Thiết lập môi trường
.\setup-env.ps1

# Thiết lập Git
.\setup-git.ps1
```

### 2. Thiết Lập Database
```powershell
# Thiết lập database development
.\setup-db-dev.ps1

# Thiết lập database production
.\setup-db-prod.ps1
```

### 3. Đồng Bộ Dữ Liệu
```powershell
# Đồng bộ toàn bộ evaluation data
.\sync-evaluation-complete.ps1

# Hoặc chỉ đồng bộ EvaluationOption
.\sync-evaluation-option-dev-to-prod.ps1
```

### 4. Deploy
```powershell
# Deploy production
.\deploy-prod.ps1
```

## 🎯 Kết Quả Sau Dọn Dẹp

- ✅ **Giảm từ 24 xuống 15 PowerShell scripts** (giảm 37.5%)
- ✅ **Xóa 8 file trùng lặp**
- ✅ **Tổ chức rõ ràng theo chức năng**
- ✅ **Dễ bảo trì và sử dụng**
- ✅ **Giảm confusion khi chọn script**

## 📝 Lưu Ý

- **Luôn backup trước khi chạy script**
- **Kiểm tra kết nối database trước khi thực hiện**
- **Đọc documentation của từng script trước khi sử dụng**
- **Sử dụng script phù hợp với mục đích cụ thể**
