# Plan: Real-time Notification Toggle for STUDENT & CLUB_LEADER

Add a notification toggle button in the sidebar (next to dark mode toggle) that enables real-time polling for new messages across all clubs. When enabled, display unread message badges on the Chat navigation item, with per-club breakdowns for students with multiple clubs.

## Steps

1. **Create notification context and state management** in new `contexts/notification-context.tsx` to track toggle on/off state, last-seen timestamps per club (stored in localStorage via `lib/browser-utils.ts`), unread counts per club, and total unread count.

2. **Add notification toggle button** in `components/sidebar.tsx` header section (lines 984-1003) positioned between logo and `ThemeToggle`, visible only for STUDENT and CLUB_LEADER roles, using Bell/BellOff icons from Lucide with default state OFF.

3. **Implement background polling service** in notification context that runs when toggle is ON, fetching messages for all user's clubs using existing `/api/chat/poll` endpoint (2-second intervals like current chat pages), calculating unread counts by comparing message timestamps against last-seen timestamps from localStorage.

4. **Display unread badges** on Chat navigation items in `sidebar.tsx` - for STUDENT role (line 86) show total unread count, and in club dropdown menus (similar to existing badge pattern lines 1349-1378) show per-club unread counts with color-coded badges for clubs with new messages.

5. **Update last-seen timestamps** in `app/student/chat/page.tsx` and `app/club-leader/chat/page.tsx` when user opens chat page or switches clubs, automatically clearing badges for viewed clubs and persisting timestamps to localStorage.

6. **Add notification state persistence** using `safeLocalStorage` with key `"clubly-notification-settings"` to remember toggle state and last-seen timestamps structure `{ enabled: boolean, lastSeen: { [clubId: number]: number } }` across sessions.

## Further Considerations

1. **Polling performance** - With multiple clubs, consider batching API calls or implementing a single endpoint that returns unread counts for all clubs at once instead of N separate polls?

2. **Badge clearing behavior** - Should badges clear immediately when chat page loads, or only after user scrolls to latest messages / after a delay to ensure messages are actually viewed?

3. **Notification persistence on logout** - Should last-seen timestamps be cleared on logout, or persist across login sessions for the same user?
