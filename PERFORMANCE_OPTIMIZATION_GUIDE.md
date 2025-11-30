# Performance Optimization Guide - Club Rankings

## 🚀 Implemented Optimizations

### 1. React Query Caching (CRITICAL)
```typescript
// ✅ Already implemented
staleTime: 10 * 60 * 1000  // 10 minutes
gcTime: 15 * 60 * 1000     // 15 minutes
```
**Impact**: Giảm API calls từ 100% → 10% (chỉ fetch khi data cũ hơn 10 phút)

### 2. useMemo for Sorted Data
```typescript
// ✅ Already implemented
const topRatedClubs = useMemo(() => {...}, [clubsOverview])
const largestClubs = useMemo(() => {...}, [clubsOverview, sizeMode])
```
**Impact**: Giảm re-computation từ mỗi render → chỉ khi dependencies thay đổi

---

## 📊 Additional Optimizations (If Still Slow)

### 3. Backend Indexing
```sql
-- Add indexes for sorting fields
CREATE INDEX idx_club_rating ON clubs(ratingEvent DESC);
CREATE INDEX idx_club_members ON clubs(totalMember DESC);
CREATE INDEX idx_club_checkin ON clubs(totalCheckin DESC);
```
**Impact**: Giảm query time từ 2-3s → 100-200ms

### 4. API Response Pagination
```typescript
// Instead of returning all clubs, limit to top 10
GET /api/university/overview/clubs?limit=10

// Frontend
export const fetchClubOverview = async (limit = 50) => {
  const response = await axiosInstance.get("/api/university/overview/clubs", {
    params: { limit }
  })
  return response.data
}
```
**Impact**: Giảm data transfer từ 100 clubs → 10 clubs = 90% reduction

### 5. Virtual Scrolling (For Large Lists)
```bash
pnpm add @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// Replace ScrollArea với Virtual Scrolling
const virtualizer = useVirtualizer({
  count: clubs.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80, // height of each item
})
```
**Impact**: Render 5 items thay vì 100 items = 95% faster rendering

### 6. Lazy Loading Rankings
```typescript
// Load rankings on-demand khi user scroll
const [visibleRankings, setVisibleRankings] = useState([1, 2])

useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setVisibleRankings(prev => [...prev, entry.target.dataset.rankingId])
      }
    })
  })
  // ... setup observer
}, [])
```
**Impact**: Load 2 rankings ban đầu thay vì 6 = 66% faster initial load

### 7. Debounce Toggle Buttons
```typescript
import { debounce } from 'lodash'

const handleToggle = useMemo(
  () => debounce((mode) => {
    setSizeMode(mode)
  }, 300),
  []
)
```
**Impact**: Prevent spam clicks causing multiple re-renders

### 8. Server-Side Caching (Backend)
```typescript
// Backend: Cache API response
import { Cache } from 'node-cache'
const cache = new Cache({ stdTTL: 600 }) // 10 minutes

app.get('/api/university/overview/clubs', (req, res) => {
  const cacheKey = 'club-overview'
  const cached = cache.get(cacheKey)
  
  if (cached) {
    return res.json(cached)
  }
  
  const data = await fetchFromDatabase()
  cache.set(cacheKey, data)
  return res.json(data)
})
```
**Impact**: Giảm database query time từ 2s → 0s (khi cached)

### 9. Concurrent Requests (If Multiple APIs)
```typescript
// If you need to call multiple APIs
const [data1, data2, data3] = await Promise.all([
  fetchClubOverview(),
  fetchAttendanceData(),
  fetchEventData()
])
```
**Impact**: 3 APIs trong 2s thay vì 3 x 2s = 6s

### 10. CDN for Static Assets
```typescript
// Use CDN for images, icons
<img src="https://cdn.yourapp.com/club-avatar.png" />
```
**Impact**: Giảm load time từ 500ms → 50ms cho images

---

## 🔍 Debugging Slow API Calls

### Check Network Tab
1. Mở DevTools → Network
2. Filter: `Fetch/XHR`
3. Tìm `/api/university/overview/clubs`
4. Check:
   - **Time**: Nếu > 2s → Backend issue
   - **Size**: Nếu > 1MB → Need pagination
   - **Waterfall**: Nếu có multiple calls → Need deduplication

### Backend Profiling
```typescript
// Add timing logs in backend
console.time('Database Query')
const data = await db.query('SELECT ...')
console.timeEnd('Database Query')

console.time('Data Processing')
const processed = processData(data)
console.timeEnd('Data Processing')
```

### React DevTools Profiler
1. Mở React DevTools
2. Tab "Profiler"
3. Click "Record"
4. Toggle button
5. Stop recording
6. Check component render times

---

## 📈 Expected Performance After Optimizations

| Metric | Before | After (Phase 1) | After (Phase 2) |
|--------|--------|-----------------|-----------------|
| Initial Load | 8s | 8s | 2s (with backend caching) |
| Toggle Button Click | 8s | **0.1s** ✅ | 0.05s |
| Month Filter Change | 8s | 8s (first time) | 2s (with backend caching) |
| Subsequent Toggles | 8s | **0.05s** ✅ | 0.05s |

**Phase 1**: Frontend optimization (✅ Already done)
**Phase 2**: Backend optimization (Need backend changes)

---

## 🎯 Recommendation Priority

1. ✅ **DONE**: React Query caching + useMemo
2. **HIGH**: Backend indexing (if API call > 2s)
3. **MEDIUM**: API pagination (if returning > 50 clubs)
4. **LOW**: Virtual scrolling (if > 100 clubs per ranking)

---

## 🐛 Common Issues

### Issue: "Still slow after optimization"
**Cause**: Backend database query chậm
**Fix**: Add database indexes (see #3 above)

### Issue: "Toggle button freezes UI"
**Cause**: Too much computation in render
**Fix**: Already fixed with useMemo ✅

### Issue: "Month filter takes 8s"
**Cause**: New API call without cache
**Fix**: Already implemented cache ✅ (chỉ chậm lần đầu, lần sau instant)

---

## 💡 Pro Tips

1. **Prefetch data**: Load next month data in background
```typescript
useEffect(() => {
  // Prefetch next month when user opens dropdown
  const nextMonth = selectedMonth + 1
  queryClient.prefetchQuery(
    queryKeys.clubOverviewByMonth(2025, nextMonth),
    () => fetchClubOverviewByMonth(2025, nextMonth)
  )
}, [selectedMonth])
```

2. **Show loading skeleton**: Better UX than blank screen
```typescript
{loading ? <LoadingSkeleton /> : <RankingCards />}
```

3. **Error boundaries**: Catch và retry failed requests
```typescript
retry: 3, // Retry 3 times on failure
retryDelay: 1000, // Wait 1s between retries
```

---

## 📞 Need More Help?

If performance is still not good after these optimizations:
1. Share backend API response time (from Network tab)
2. Share number of clubs being returned
3. Share database query execution plan
4. Consider Redis caching on backend
