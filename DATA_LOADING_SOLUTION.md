# Giải pháp Load Data cho Sidebar và Profile Widget sau khi Đăng nhập

## Vấn đề
Sau khi user đăng nhập, **Sidebar** và **Profile Widget** không tự động load data từ API:
- **Sidebar** sử dụng `DataContext` (localStorage) - data không được fetch lại
- **Profile Widget** đã dùng React Query nhưng cần đảm bảo refetch đúng cách

## Giải pháp Đã Implement

### 1. Hook `useDataLoader` (hooks/use-data-loader.ts)
Hook này tự động fetch data từ API vào `DataContext` sau khi user đăng nhập.

**Tính năng:**
- Tự động detect khi user đăng nhập (dựa vào `isAuthenticated`)
- Fetch data dựa trên role của user:
  - **Student**: Events, Clubs
  - **Club Leader**: Events, Clubs (policies được fetch riêng trong dashboard page qua major API)
  - **Uni Staff**: Events, Clubs, Policies, Club Applications
  - **Admin**: Events, Clubs, Users, Policies
- Sử dụng `Promise.allSettled` để fetch parallel và không bị fail nếu 1 API lỗi
- Có logging chi tiết để debug

**Cách hoạt động:**
```typescript
useEffect(() => {
  if (!isAuthenticated) return
  
  // Fetch data based on role
  // Update DataContext with fetched data
  // Data will be available for Sidebar and other components
}, [isAuthenticated, auth.user, auth.role])
```

### 2. Tích hợp vào AppShell (components/app-shell.tsx)
Hook được gọi trong `AppShell` để đảm bảo chạy cho tất cả các trang sau khi login:

```typescript
export function AppShell({ children }: AppShellProps) {
  // ... other code
  
  // Load data into DataContext after login
  useDataLoader()
  
  // ... rest of component
}
```

### 3. Cải thiện Profile Widget (hooks/use-query-hooks.ts)
Cập nhật `useFullProfile` hook để refetch khi component mount:

```typescript
export function useFullProfile(enabled = true) {
  return useQuery<Profile, Error>({
    queryKey: queryKeys.fullProfile,
    queryFn: async () => {
      const profile = await fetchProfile()
      return profile as Profile
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true, // ✅ Refetch when component mounts
  })
}
```

### 4. Clear Cache khi Logout (contexts/auth-context.tsx)
Khi user logout, tất cả React Query cache sẽ được clear:

```typescript
const logout = () => {
  // ... clear storage
  
  // Clear React Query cache
  queryClient.clear()
  
  // Redirect to home
  router.replace("/")
}
```

## Flow Hoạt động

### Khi Đăng nhập:
1. User đăng nhập thành công → `auth` state được set
2. `AppShell` render → `useDataLoader` hook được gọi
3. Hook detect `isAuthenticated = true` → bắt đầu fetch data
4. Data được fetch theo role và populate vào `DataContext`
5. **Sidebar** nhận data từ `DataContext` → hiển thị badges, counts
6. **Profile Widget** fetch data qua `useFullProfile` → hiển thị avatar, points, wallets

### Khi Logout:
1. User click logout
2. `AuthContext.logout()` được gọi
3. Clear localStorage/sessionStorage
4. **Clear React Query cache** → tất cả query sẽ refetch khi login lại
5. Reset auth state
6. Redirect về trang chủ

## Lợi ích

✅ **Tự động**: Không cần thêm code ở từng trang  
✅ **Dựa trên role**: Chỉ fetch data cần thiết cho từng role  
✅ **Performance**: Fetch parallel với `Promise.allSettled`  
✅ **Reliable**: Không fail toàn bộ nếu 1 API lỗi  
✅ **Clean**: Clear cache khi logout để tránh data leak  
✅ **Debug-friendly**: Logging chi tiết cho mỗi step  

## Testing

### Test Scenario 1: Login as Student
1. Đăng nhập với tài khoản Student
2. Kiểm tra console logs:
   ```
   🔄 useDataLoader: Loading data for role: student
   ✅ useDataLoader: Loaded events for student: X
   ✅ useDataLoader: Loaded clubs for student: Y
   ```
3. Kiểm tra Sidebar hiển thị đúng số lượng events/clubs
4. Kiểm tra Profile Widget hiển thị đúng avatar và points

### Test Scenario 2: Login as Club Leader
1. Đăng nhập với tài khoản Club Leader
2. Kiểm tra console logs chỉ fetch events và clubs (không fetch policies)
3. Kiểm tra Sidebar hiển thị đúng data
4. Kiểm tra Profile Widget hiển thị multiple wallets (nếu có)
5. Kiểm tra Dashboard page fetch policy name riêng qua major API

### Test Scenario 3: Logout và Login lại
1. Đăng xuất → check console có log "Clearing React Query cache"
2. Đăng nhập lại → check data được fetch lại từ API
3. Kiểm tra không có data cũ từ session trước

## Maintenance

### Thêm API mới cho một role:
Mở `hooks/use-data-loader.ts` và thêm vào block tương ứng:

```typescript
if (auth.role === "your_role") {
  promises.push(
    yourNewApi()
      .then((data) => {
        if (!mounted) return
        console.log("✅ useDataLoader: Loaded your data:", data.length)
        updateYourData(data)
      })
      .catch((err) => console.error("❌ Failed to load your data:", err))
  )
}
```

### Debug không load data:
1. Check console logs có xuất hiện "🔄 useDataLoader: Loading data" không
2. Check `isAuthenticated` có đúng không
3. Check API endpoint có hoạt động không (xem error logs)
4. Check `DataContext` có method `updateXXX` tương ứng không

## Notes

- Hook này chỉ populate data vào `DataContext` (localStorage)
- Nếu muốn dùng React Query cho một component, tạo custom hook riêng (như `useFullProfile`)
- Data trong `DataContext` sẽ persist qua page refresh (vì dùng localStorage)
- Khi logout, cả localStorage và React Query cache đều được clear

## Files Changed

1. ✅ `hooks/use-data-loader.ts` - New file: Hook tự động load data
2. ✅ `components/app-shell.tsx` - Tích hợp hook vào AppShell
3. ✅ `hooks/use-query-hooks.ts` - Cập nhật useFullProfile với refetchOnMount
4. ✅ `contexts/auth-context.tsx` - Thêm clear React Query cache khi logout

## Future Improvements

- [ ] Thêm loading indicator khi data đang fetch
- [ ] Thêm error handling UI khi API fail
- [ ] Thêm retry logic cho failed API calls
- [ ] Cache invalidation thông minh hơn (không clear toàn bộ cache khi logout)

