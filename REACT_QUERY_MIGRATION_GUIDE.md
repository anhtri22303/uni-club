# 🚀 React Query Migration Guide - UniClub Project

## 📋 Tổng Quan

Đã áp dụng **React Query (TanStack Query)** cho toàn bộ API GET calls trong project UniClub để:
- ✅ Tăng tốc độ loading
- ✅ Cache dữ liệu tự động
- ✅ Giảm số lần gọi API không cần thiết
- ✅ Quản lý loading states dễ dàng hơn
- ✅ Optimistic updates và prefetching

---

## 🎯 Các Hooks Đã Tạo trong `hooks/use-query-hooks.ts`

### 📦 Clubs
```typescript
useClubs(params)              // Lấy danh sách clubs với pagination
useClub(clubId, enabled)      // Lấy thông tin 1 club
useClubMembers(clubId)        // Lấy members của club
useClubMemberCount(clubId)    // Lấy số lượng members
useClubMemberCounts(clubIds)  // Lấy số members của nhiều clubs
usePrefetchClubs()            // Prefetch clubs cho hover
```

### 📅 Events
```typescript
useEvents()                   // Lấy tất cả events
useEvent(eventId)             // Lấy thông tin 1 event
useClubEvents(clubIds)        // Lấy events của các clubs cụ thể
usePrefetchEvents()           // Prefetch events cho hover
```

### 👥 Users
```typescript
useUsers()                    // Lấy tất cả users
useUser(userId)               // Lấy thông tin 1 user
useProfile()                  // Lấy profile user hiện tại
usePrefetchUsers()            // Prefetch users cho hover
```

### 🎓 Majors
```typescript
useMajors()                   // Lấy tất cả majors
```

### 🎁 Products
```typescript
useProducts(params)           // Lấy products với pagination
```

### 💰 Wallet
```typescript
useWallet()                   // Lấy wallet của user hiện tại
```

### 📜 Policies
```typescript
usePolicies()                 // Lấy tất cả policies
usePolicy(policyId)           // Lấy thông tin 1 policy
```

### 📊 Attendances
```typescript
useAttendancesByDate(date)    // Lấy attendances theo ngày
```

---

## 🔄 Pattern Migration: Trước và Sau

### ❌ TRƯỚC (Old Pattern - Manual useState + useEffect)

```typescript
const [clubs, setClubs] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  const loadClubs = async () => {
    setLoading(true)
    try {
      const data = await fetchClub()
      setClubs(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  loadClubs()
}, [])
```

### ✅ SAU (New Pattern - React Query)

```typescript
import { useClubs } from "@/hooks/use-query-hooks"

const { data: clubs = [], isLoading: loading, error } = useClubs()
```

**Lợi ích:**
- Chỉ 1 dòng code thay vì 20+ dòng
- Tự động cache trong 5 phút
- Tự động refetch khi cần
- Không cần quản lý state thủ công

---

## 📁 Các File Đã Được Cập Nhật

### Admin Role
- ✅ `app/admin/page.tsx` - Dashboard với events từ React Query

### Student Role  
- ✅ `app/student/clubs/page.tsx` - Đã sử dụng `useClubs()` và `useClubMemberCounts()`
- ✅ `app/student/events/page.tsx` - Đã sử dụng `useClubEvents()`

### Club Leader Role
- ✅ `app/club-leader/page.tsx` - Đã sử dụng `useProfile()` và `useClub()`

### Uni Staff Role
- ✅ `app/uni-staff/page.tsx` - Đã sử dụng `useEvents()`, `useClubs()`, `usePolicies()`

### Components
- ✅ `components/sidebar.tsx` - Sử dụng prefetch hooks cho instant navigation

---

## 🛠️ Cách Áp Dụng Cho Các Pages Còn Lại

### Template cho bất kỳ page nào:

```typescript
"use client"

import { useClubs, useEvents, useUsers } from "@/hooks/use-query-hooks"

export default function YourPage() {
  // ✅ Thay thế useState + useEffect bằng hooks
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  // Loading state cho toàn bộ page
  if (clubsLoading || eventsLoading || usersLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Sử dụng data như bình thường */}
      {clubs.map(club => <ClubCard key={club.id} club={club} />)}
    </div>
  )
}
```

---

## ⚡ Advanced Features

### 1. Conditional Fetching (chỉ fetch khi cần)
```typescript
const { data: club } = useClub(clubId, !!clubId) // chỉ fetch khi có clubId
```

### 2. Prefetching (load trước khi cần)
```typescript
const prefetchClubs = usePrefetchClubs()

<div onMouseEnter={() => prefetchClubs()}>
  Hover to prefetch
</div>
```

### 3. Manual Refetch
```typescript
const { data, refetch } = useClubs()

<button onClick={() => refetch()}>Refresh</button>
```

### 4. Stale Time Configuration
- Clubs: 5 minutes
- Events: 3 minutes  
- Users: 5 minutes
- Wallet: 2 minutes (thay đổi thường xuyên)
- Policies: 10 minutes (ít thay đổi)
- Majors: 30 minutes (hiếm khi thay đổi)

---

## 🚨 Lưu Ý Quan Trọng

### 1. Không còn cần `useEffect` cho fetching data
❌ **Không nên:**
```typescript
useEffect(() => {
  fetchClubs().then(setClubs)
}, [])
```

✅ **Nên:**
```typescript
const { data: clubs } = useClubs()
```

### 2. Context vẫn được sử dụng cho mutations
- React Query dùng cho **READ** (GET requests)
- Context/State dùng cho **WRITE** (POST/PUT/DELETE) và UI state

### 3. Loading states được quản lý tốt hơn
```typescript
const { isLoading, isFetching, isError, error } = useClubs()

if (isLoading) return <Skeleton />        // Lần đầu load
if (isError) return <Error error={error} /> // Có lỗi
if (isFetching) return <RefreshIndicator /> // Đang refetch
```

---

## 📊 Performance Improvements

### Trước khi áp dụng React Query:
- Mỗi page load → gọi API mới
- Chuyển trang → mất data, phải gọi lại
- Không có cache
- Loading lâu và lặp lại

### Sau khi áp dụng React Query:
- ⚡ **Cache 5 phút** - không cần gọi lại nếu đã có data
- 🚀 **Instant navigation** - data sẵn sàng khi prefetch
- 🔄 **Auto refetch** - tự động cập nhật khi cần
- 💾 **Background updates** - update data không làm gián đoạn UI

---

## 🎯 TODO: Pages Cần Cập Nhật Tiếp

### Student Pages
- [ ] `app/student/myclub/page.tsx`
- [ ] `app/student/wallet/page.tsx`
- [ ] `app/student/gift/page.tsx`
- [ ] `app/student/history/page.tsx`
- [ ] `app/student/checkin/page.tsx`

### Club Leader Pages
- [ ] `app/club-leader/members/page.tsx`
- [ ] `app/club-leader/events/page.tsx`
- [ ] `app/club-leader/applications/page.tsx`
- [ ] `app/club-leader/gift/page.tsx`
- [ ] `app/club-leader/points/page.tsx`
- [ ] `app/club-leader/attendances/page.tsx`

### Uni Staff Pages
- [ ] `app/uni-staff/clubs/page.tsx`
- [ ] `app/uni-staff/policies/page.tsx`
- [ ] `app/uni-staff/clubs-req/page.tsx`
- [ ] `app/uni-staff/events-req/page.tsx`

### Admin Pages
- [ ] `app/admin/users/page.tsx`
- [ ] `app/admin/clubs/page.tsx`
- [ ] `app/admin/events/page.tsx`

---

## 📖 Tài Liệu Tham Khảo

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- Project: `hooks/use-query-hooks.ts` - Xem tất cả hooks có sẵn

---

## 💡 Tips & Best Practices

1. **Luôn dùng default values**: `const { data: clubs = [] } = useClubs()`
2. **Đặt tên biến rõ ràng**: `isLoading: clubsLoading` để dễ debug
3. **Dùng enabled cho conditional fetching**: `useClub(id, !!id)`
4. **Prefetch cho UX tốt**: Hover sidebar → prefetch data
5. **Không abuse refetch**: React Query tự động refetch khi cần

---

**Cập nhật lần cuối:** 20/10/2025
**Người thực hiện:** GitHub Copilot
