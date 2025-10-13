# Cập nhật Logic Lưu intendedPath

## Thay đổi thực hiện:

### 1. ProtectedRoute Component (`contexts/protected-route.tsx`)
- **Trước**: Lưu `intendedPath` cho tất cả các trang được bảo vệ khi người dùng chưa đăng nhập
- **Sau**: Chỉ lưu `intendedPath` khi người dùng truy cập trang có pattern `/student/checkin/[code]`

**Logic mới:**
```typescript
const isCheckinCodePage = /^\/student\/checkin\/[^/]+$/.test(pathname);

if (isCheckinCodePage) {
  // Chỉ lưu cho trang checkin với mã QR (chỉ dùng safeSessionStorage)
  safeSessionStorage.setItem('intendedPath', pathname);
} else {
  // Không lưu cho các trang khác
  console.log(`ProtectedRoute: Không lưu intendedPath cho trang: ${pathname}`);
}
```

### 2. AuthContext Component (`contexts/auth-context.tsx`)
- **Cập nhật comment**: Làm rõ rằng `intendedPath` chỉ được lưu từ trang checkin
- **Logic xử lý**: Giữ nguyên logic hiện tại, nhưng giờ `intendedPath` chỉ có khi user truy cập trang checkin mà chưa đăng nhập

## Kết quả:

### Trường hợp 1: User truy cập `/student/checkin/ABC123` mà chưa đăng nhập
1. ProtectedRoute phát hiện là trang checkin → lưu `intendedPath = "/student/checkin/ABC123"`
2. User được chuyển về trang chủ để đăng nhập
3. Sau khi đăng nhập thành công → AuthContext đọc `intendedPath` và chuyển về `/student/checkin/ABC123`

### Trường hợp 2: User truy cập `/student/events` hoặc trang khác mà chưa đăng nhập
1. ProtectedRoute không lưu `intendedPath`
2. User được chuyển về trang chủ để đăng nhập  
3. Sau khi đăng nhập thành công → AuthContext không tìm thấy `intendedPath`, chuyển về trang mặc định theo role (`/profile` cho student)

### Trường hợp 3: User đăng nhập từ trang chủ
1. Không có `intendedPath` trong sessionStorage
2. AuthContext chuyển user về trang mặc định theo role

## Regex Pattern được sử dụng:
```typescript
/^\/student\/checkin\/[^/]+$/
```

Regex này khớp với:
- ✅ `/student/checkin/ABC123`
- ✅ `/student/checkin/qr-code-456`
- ✅ `/student/checkin/event-789`

Regex này KHÔNG khớp với:
- ❌ `/student/checkin/` (thiếu code)
- ❌ `/student/checkin/code/extra` (có thêm segment)
- ❌ `/student/events/123`
- ❌ `/admin/checkin/ABC123`