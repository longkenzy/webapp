# API Response Format Migration Guide

## Tổng quan
Sau khi tối ưu hóa API, response format đã được chuẩn hóa từ format cũ (trả về data trực tiếp) sang format mới (standardized response object).

## Thay đổi Response Format

### ❌ Format Cũ (Before)
```javascript
// API trả về data trực tiếp
const response = await fetch('/api/employees/list');
const employees = await response.json(); // Array trực tiếp
```

### ✅ Format Mới (After)
```javascript
// API trả về standardized response object
const response = await fetch('/api/employees/list');
const result = await response.json();
// result = { success: true, data: [...], message?: string }
const employees = result.data;
```

## Cách Fix Code Hiện Tại

### Option 1: Manual Fix (Recommended)
```javascript
// Cũ
const data = await response.json();
setEmployees(data);

// Mới - Handle cả 2 format để backward compatible
const result = await response.json();
const data = result.data || result; // Fallback to old format
setEmployees(data);
```

### Option 2: Sử dụng API Client Mới
```javascript
import { apiClient } from '@/lib/api-client';

// Thay vì fetch manual
const employees = await apiClient.getEmployeesList();
setEmployees(employees);
```

## Các API Đã Được Chuẩn Hóa

### ✅ Đã Update
- `/api/employees/list` - Danh sách nhân viên
- `/api/dashboard/cases` - Dashboard cases
- `/api/internal-cases` - Internal cases
- `/api/maintenance-cases` - Maintenance cases
- `/api/health` - Health check

### 🔄 Cần Update (Future)
- `/api/partners/list`
- `/api/deployment-cases`
- `/api/warranties`
- Các API khác...

## Files Đã Được Fix

### ✅ Đã Fix Tự Động
- `src/app/admin/delivery-cases/page.tsx`
- `src/app/admin/receiving-cases/page.tsx`
- `src/app/admin/delivery-cases/CreateDeliveryCaseModal.tsx`
- `src/app/admin/receiving-cases/CreateReceivingCaseModal.tsx`
- `src/app/user/work/receiving/CreateReceivingCaseModal.tsx`
- `src/app/admin/work/warranty/page.tsx`
- `src/app/admin/work/maintenance/page.tsx`
- `src/app/admin/work/incident/page.tsx`

### ⚠️ Cần Fix Thủ Công
Các file sau có thể cần fix thủ công do pattern phức tạp:
- `src/app/user/work/warranty/CreateWarrantyModal.tsx`
- `src/app/user/work/maintenance/CreateMaintenanceModal.tsx`
- `src/app/user/work/incident/CreateIncidentModal.tsx`
- `src/app/user/work/internal/CreateInternalCaseModal.tsx`
- `src/app/user/work/deployment/CreateDeploymentModal.tsx`
- `src/app/admin/work/warranty/CreateWarrantyModal.tsx`
- `src/app/admin/work/internal/EditInternalCaseModal.tsx`
- `src/app/admin/work/maintenance/CreateMaintenanceModal.tsx`
- `src/app/admin/work/incident/EditIncidentModal.tsx`
- `src/app/admin/work/deployment/CreateDeploymentModal.tsx`
- `src/app/admin/work/deployment/page.tsx`

## Error Patterns Cần Tìm

### 1. TypeError: data.map is not a function
```javascript
// Lỗi này xảy ra khi:
const data = await response.json(); // data = { success: true, data: [...] }
data.map(...) // ❌ data không phải array

// Fix:
const result = await response.json();
const data = result.data || result;
data.map(...) // ✅
```

### 2. Undefined properties
```javascript
// Lỗi này xảy ra khi:
const employees = await response.json(); // employees = { success: true, data: [...] }
employees.length // ❌ undefined

// Fix:
const result = await response.json();
const employees = result.data || result;
employees.length // ✅
```

## Testing

### Manual Testing
1. Chạy dev server: `npm run dev`
2. Test các trang có sử dụng API employees/list
3. Kiểm tra console không có lỗi

### Automated Testing
```bash
# Test API endpoints
node scripts/test-api-endpoints.js

# Validate optimization
node scripts/validate-optimization.js
```

## Best Practices

### 1. Sử dụng API Client
```javascript
import { apiClient } from '@/lib/api-client';

// Thay vì
const response = await fetch('/api/employees/list');
const result = await response.json();
const employees = result.data || result;

// Sử dụng
const employees = await apiClient.getEmployeesList();
```

### 2. Error Handling
```javascript
try {
  const employees = await apiClient.getEmployeesList();
  setEmployees(employees);
} catch (error) {
  console.error('Failed to fetch employees:', error);
  setEmployees([]);
}
```

### 3. TypeScript Support
```typescript
import { apiClient } from '@/lib/api-client';

const employees: Employee[] = await apiClient.getEmployeesList();
```

## Rollback Plan

Nếu có vấn đề, có thể rollback bằng cách:

1. **Temporary Fix**: Update API để trả về format cũ
```typescript
// In API route
return NextResponse.json(employees); // Old format
// Instead of
return successResponse(employees); // New format
```

2. **Complete Rollback**: Revert các file API routes về version trước optimization

## Support

Nếu gặp vấn đề:
1. Kiểm tra console browser để xem error message
2. Verify API response format bằng Network tab
3. Test với Postman/curl để đảm bảo API hoạt động
4. Check database connection và authentication