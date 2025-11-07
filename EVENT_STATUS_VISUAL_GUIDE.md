# 🎨 Event Status System - Visual Style Guide

## 📊 Status Color Palette

### Complete Status Reference Table

| # | Status Code | Display Name | Emoji | Color Name | Hex Code | Background | Border | Text |
|---|-------------|--------------|-------|------------|----------|------------|--------|------|
| 1 | `PENDING_COCLUB` | Pending Co-Club | ⏳ | Orange | `#fb923c` | `orange-50` | `orange-500` | `orange-700` |
| 2 | `PENDING_UNISTAFF` | Pending UniStaff | 🕓 | Amber | `#fbbf24` | `amber-50` | `amber-500` | `amber-700` |
| 3 | `APPROVED` | Approved | ✅ | Green | `#22c55e` | `green-50` | `green-500` | `green-700` |
| 4 | `ONGOING` | Ongoing | 🟢 | Blue | `#3b82f6` | `blue-50` | `blue-500` | `blue-700` |
| 5 | `COMPLETED` | Completed | 🏁 | Emerald | `#10b981` | `emerald-50` | `emerald-500` | `emerald-700` |
| 6 | `REJECTED` | Rejected | ❌ | Red | `#ef4444` | `red-50` | `red-500` | `red-700` |
| 7 | `CANCELLED` | Cancelled | 🚫 | Gray | `#6b7280` | `gray-50` | `gray-500` | `gray-700` |

---

## 🎯 Badge Component Examples

### React/TypeScript Badge Rendering

```tsx
<Badge 
  variant="outline"
  className={
    status === "PENDING_COCLUB" 
      ? "border-orange-500 text-orange-700 bg-orange-50"
      : status === "PENDING_UNISTAFF"
      ? "border-amber-500 text-amber-700 bg-amber-50"
      : status === "APPROVED"
      ? "border-green-500 text-green-700 bg-green-50"
      : status === "ONGOING"
      ? "border-blue-500 text-blue-700 bg-blue-50"
      : status === "COMPLETED"
      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
      : status === "REJECTED"
      ? "border-red-500 text-red-700 bg-red-50"
      : status === "CANCELLED"
      ? "border-gray-500 text-gray-700 bg-gray-50"
      : "border-slate-500 text-slate-700 bg-slate-50"
  }
>
  {status === "PENDING_COCLUB" 
    ? "⏳ Pending Co-club"
    : status === "PENDING_UNISTAFF"
    ? "🕓 Pending UniStaff"
    : status === "APPROVED"
    ? "✅ Approved"
    : status === "ONGOING"
    ? "🟢 Ongoing"
    : status === "COMPLETED"
    ? "🏁 Completed"
    : status === "REJECTED"
    ? "❌ Rejected"
    : status === "CANCELLED"
    ? "🚫 Cancelled"
    : status}
</Badge>
```

---

## 📈 Chart Color References

### For Recharts Bar Charts

```typescript
const chartData = [
  { name: "Pending Co-club", count: pendingCoClubEvents, fill: "#fb923c" },
  { name: "Pending UniStaff", count: pendingUniStaffEvents, fill: "#fbbf24" },
  { name: "Approved", count: approvedEvents, fill: "#22c55e" },
  { name: "Ongoing", count: ongoingEvents, fill: "#3b82f6" },
  { name: "Completed", count: completedEvents, fill: "#10b981" },
  { name: "Rejected", count: rejectedEvents, fill: "#ef4444" },
  { name: "Cancelled", count: cancelledEvents, fill: "#6b7280" }
]
```

### For Custom Bar Charts (Progress Bars)

```typescript
<div 
  style={{
    backgroundColor: status === "PENDING_COCLUB" ? "#fb923c"
      : status === "PENDING_UNISTAFF" ? "#fbbf24"
      : status === "APPROVED" ? "#22c55e"
      : status === "ONGOING" ? "#3b82f6"
      : status === "COMPLETED" ? "#10b981"
      : status === "REJECTED" ? "#ef4444"
      : status === "CANCELLED" ? "#6b7280"
      : "#94a3b8"
  }}
/>
```

---

## 🎨 Visual Mockups

### Status Badge Preview

```
┌─────────────────────────────┐
│ ⏳ Pending Co-club          │  ← Orange border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🕓 Pending UniStaff         │  ← Amber border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ ✅ Approved                 │  ← Green border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🟢 Ongoing                  │  ← Blue border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🏁 Completed                │  ← Emerald border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ ❌ Rejected                 │  ← Red border & bg
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🚫 Cancelled                │  ← Gray border & bg
└─────────────────────────────┘
```

### Bar Chart Preview (Uni-Staff Analytics)

```
Event Status Distribution

Total: 50 Events

⏳ Pending Co-club     [████████░░░░░░░░░░] 5 (10%)
🕓 Pending UniStaff    [█████░░░░░░░░░░░░░] 3 (6%)
✅ Approved            [████████████████░░] 15 (30%)
🟢 Ongoing             [████░░░░░░░░░░░░░░] 4 (8%)
🏁 Completed           [██████████████████] 18 (36%)
❌ Rejected            [███░░░░░░░░░░░░░░░] 3 (6%)
🚫 Cancelled           [██░░░░░░░░░░░░░░░░] 2 (4%)
```

---

## 🔄 Status Lifecycle Flow

### Visual Flow Diagram

```
┌──────────────────────┐
│   Event Created      │
│   by Club Leader     │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │  ⏳ PENDING_COCLUB           │
    │  Waiting for co-club         │
    │  to accept invitation        │
    └──────────┬───────────────────┘
               │
               ├─── ❌ REJECTED (Co-club declined)
               │
               ▼
    ┌──────────────────────────────┐
    │  🕓 PENDING_UNISTAFF         │
    │  Co-club approved,           │
    │  waiting for UniStaff        │
    └──────────┬───────────────────┘
               │
               ├─── ❌ REJECTED (UniStaff declined)
               │
               ▼
    ┌──────────────────────────────┐
    │  ✅ APPROVED                 │
    │  Event approved!             │
    │  Registration open           │
    └──────────┬───────────────────┘
               │
               ├─── 🚫 CANCELLED (Club/School cancelled)
               │
               ▼
    ┌──────────────────────────────┐
    │  🟢 ONGOING                  │
    │  Event is happening now      │
    │  Check-ins active            │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  🏁 COMPLETED                │
    │  Event finished              │
    │  Points settled              │
    └──────────────────────────────┘
```

---

## 📱 Responsive Design Considerations

### Mobile (< 640px)
- Font size: `text-[10px]` for badges
- Compact padding: `px-2 py-0.5`
- Single-line display
- Emoji size maintained for visibility

### Tablet (640px - 1024px)
- Font size: `text-xs` for badges
- Standard padding: `px-2.5 py-1`
- Two-column layouts where applicable

### Desktop (> 1024px)
- Font size: `text-sm` for badges
- Full padding: `px-3 py-1.5`
- Three+ column layouts
- Additional hover effects

---

## 🎯 Business Logic Aggregations

### Key Metrics Formulas

```typescript
// Total Pending Events
const totalPending = PENDING_COCLUB + PENDING_UNISTAFF

// Active Events (ready for participation)
const activeEvents = APPROVED + ONGOING

// Total Approved (past approval stage)
const totalApproved = APPROVED + ONGOING

// Successful Events (non-failed)
const successful = APPROVED + ONGOING + COMPLETED

// Failed Events
const failed = REJECTED + CANCELLED

// Success Rate
const successRate = (successful / totalEvents) * 100

// Approval Rate
const approvalRate = ((APPROVED + ONGOING + COMPLETED) / totalEvents) * 100

// Rejection Rate
const rejectionRate = ((REJECTED + CANCELLED) / totalEvents) * 100
```

---

## ✨ Best Practices

### DO's ✅
- Always use emoji prefixes for quick visual recognition
- Maintain consistent color scheme across all components
- Use outline variant for badges to maintain hierarchy
- Include percentages in analytics views
- Provide tooltips for status explanations

### DON'Ts ❌
- Don't mix color schemes between components
- Don't use different emoji sets
- Don't remove borders from badges (reduces clarity)
- Don't use solid backgrounds (reduces readability)
- Don't abbreviate status names excessively

---

## 🔍 Testing Checklist

### Visual Testing
- [ ] All 7 statuses display correctly
- [ ] Colors match across components
- [ ] Emojis render properly on all devices
- [ ] Badges are readable in light/dark mode
- [ ] Charts display accurate percentages
- [ ] Mobile layouts don't overflow

### Functional Testing
- [ ] Filter dropdowns include all statuses
- [ ] Status counts calculate correctly
- [ ] Aggregations match business logic
- [ ] Real-time updates work properly
- [ ] Sorting by status works
- [ ] Export includes status data

### Accessibility Testing
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen readers announce statuses correctly
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Status changes announce to assistive tech

---

## 📚 Usage Examples

### Filtering Events by Status

```typescript
// Get all pending events
const pendingEvents = events.filter(e => 
  e.status === "PENDING_COCLUB" || e.status === "PENDING_UNISTAFF"
)

// Get all active events (can register/attend)
const activeEvents = events.filter(e => 
  e.status === "APPROVED" || e.status === "ONGOING"
)

// Get all failed events
const failedEvents = events.filter(e => 
  e.status === "REJECTED" || e.status === "CANCELLED"
)

// Get events awaiting action
const awaitingAction = events.filter(e => 
  e.status === "PENDING_COCLUB" || e.status === "PENDING_UNISTAFF"
)
```

### Sorting Events by Status Priority

```typescript
const statusPriority = {
  "ONGOING": 1,          // Highest priority (happening now)
  "APPROVED": 2,         // Ready to start
  "PENDING_UNISTAFF": 3, // Needs approval
  "PENDING_COCLUB": 4,   // Initial stage
  "COMPLETED": 5,        // Done
  "REJECTED": 6,         // Failed
  "CANCELLED": 7         // Failed
}

const sortedEvents = [...events].sort((a, b) => 
  statusPriority[a.status] - statusPriority[b.status]
)
```

---

## 🎨 CSS Utility Classes Reference

### Tailwind Classes Used

```css
/* Background Colors */
.bg-orange-50   /* #fff7ed */
.bg-amber-50    /* #fffbeb */
.bg-green-50    /* #f0fdf4 */
.bg-blue-50     /* #eff6ff */
.bg-emerald-50  /* #ecfdf5 */
.bg-red-50      /* #fef2f2 */
.bg-gray-50     /* #f9fafb */

/* Border Colors */
.border-orange-500  /* #f97316 */
.border-amber-500   /* #f59e0b */
.border-green-500   /* #22c55e */
.border-blue-500    /* #3b82f6 */
.border-emerald-500 /* #10b981 */
.border-red-500     /* #ef4444 */
.border-gray-500    /* #6b7280 */

/* Text Colors */
.text-orange-700  /* #c2410c */
.text-amber-700   /* #b45309 */
.text-green-700   /* #15803d */
.text-blue-700    /* #1d4ed8 */
.text-emerald-700 /* #047857 */
.text-red-700     /* #b91c1c */
.text-gray-700    /* #374151 */
```

---

*Complete Visual Style Guide*  
*Version: 2.0*  
*Last Updated: November 7, 2025*

