# 🏗️ Student Chat Feature - Architecture

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT LOGIN                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │ Check localStorage   │
        │  "uniclub-auth"      │
        │                      │
        │ clubIds: [1, 5, 7]?  │
        │   or clubId: 1?      │
        └──────┬───────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌───────┐          ┌─────────────┐
│  NO   │          │    YES      │
│ CLUBS │          │  HAS CLUBS  │
└───┬───┘          └──────┬──────┘
    │                     │
    ▼                     ▼
┌───────────────┐   ┌──────────────────┐
│ Chat menu     │   │ ✅ Chat menu     │
│ HIDDEN        │   │    VISIBLE       │
└───────────────┘   └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Click "Chat"    │
                    └────────┬────────┘
                             │
              ┌──────────────┴───────────────┐
              │                              │
              ▼                              ▼
    ┌──────────────────┐           ┌─────────────────┐
    │  ONE CLUB        │           │ MULTIPLE CLUBS  │
    │  clubIds: [1]    │           │ clubIds: [1,5,7]│
    └────────┬─────────┘           └────────┬────────┘
             │                              │
             ▼                              ▼
    ┌─────────────────┐           ┌──────────────────┐
    │ Auto-select     │           │ Show dropdown    │
    │ Club #1         │           │ selector with    │
    │ (no selector)   │           │ club names       │
    └────────┬────────┘           └────────┬─────────┘
             │                              │
             │                              ▼
             │                    ┌──────────────────┐
             │                    │ User selects     │
             │                    │ a club           │
             │                    └────────┬─────────┘
             │                             │
             └──────────────┬──────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Load Chat Messages  │
                │ for selected club   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Display Chat UI     │
                │ • Messages          │
                │ • Input box         │
                │ • Send button       │
                └──────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐    ┌─────────────────┐
        │ Poll every   │    │ Send messages   │
        │ 2 seconds    │    │ on Enter/Click  │
        │ for new msgs │    └─────────────────┘
        └──────────────┘
```

## 🔄 Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (CLIENT)                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           app/student/chat/page.tsx                  │    │
│  │                                                       │    │
│  │  1. Load clubIds from localStorage                   │    │
│  │     ↓                                                 │    │
│  │  2. Fetch club details via useClubs()                │    │
│  │     ↓                                                 │    │
│  │  3. Display club selector (if multiple)              │    │
│  │     ↓                                                 │    │
│  │  4. Fetch initial messages                           │    │
│  │     GET /api/chat/messages?clubId=X&limit=50         │    │
│  │     ↓                                                 │    │
│  │  5. Start polling (every 2 seconds)                  │    │
│  │     GET /api/chat/poll?clubId=X&after=timestamp      │    │
│  │     ↓                                                 │    │
│  │  6. Send messages                                    │    │
│  │     POST /api/chat/messages                          │    │
│  │     {clubId, userId, userName, message}              │    │
│  └───────────────────┬───────────────────────────────────┘    │
│                      │                                        │
└──────────────────────┼────────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  /api/chat/messages (GET & POST)                       │  │
│  │  • Validate clubId & userId                            │  │
│  │  • Check authentication                                │  │
│  │  • Format messages                                     │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  /api/chat/poll (GET)                                  │  │
│  │  • Get messages after timestamp                        │  │
│  │  • Return only new messages                            │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ Redis Protocol
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                   UPSTASH REDIS                               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  SORTED SET: chat:messages:{clubId}                    │  │
│  │                                                         │  │
│  │  Score (Timestamp) │ Value (Message JSON)              │  │
│  │  ─────────────────┼───────────────────────────────    │  │
│  │  1730304000001    │ {id, userId, userName, msg...}    │  │
│  │  1730304120500    │ {id, userId, userName, msg...}    │  │
│  │  1730304300100    │ {id, userId, userName, msg...}    │  │
│  │                                                         │  │
│  │  TTL: 30 days (auto-expire)                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Each club has its own isolated sorted set                   │
│  • Club 1: chat:messages:1                                   │
│  • Club 5: chat:messages:5                                   │
│  • Club 7: chat:messages:7                                   │
└───────────────────────────────────────────────────────────────┘
```

## 🏗️ Component Structure

```
app/student/chat/page.tsx
│
├── 📦 Imports
│   ├── UI Components (Card, Button, Input, Select, Avatar, etc.)
│   ├── Hooks (useAuth, useProfile, useClub, useClubs)
│   ├── Icons (Send, MessageCircle, Building2, Loader2)
│   └── Utils (safeLocalStorage, axios)
│
├── 🎯 State Management
│   ├── availableClubIds: number[]          // From localStorage
│   ├── availableClubs: ClubDetails[]       // With names from API
│   ├── selectedClubId: number | null       // Current active chat
│   ├── messages: ChatMessage[]             // Current chat messages
│   ├── newMessage: string                  // Input field value
│   ├── loading: boolean                    // Loading state
│   ├── sending: boolean                    // Sending message state
│   ├── latestTimestamp: number             // For polling
│   └── error: string | null                // Error messages
│
├── 🔄 Effects
│   ├── useEffect #1: Load clubIds from localStorage
│   ├── useEffect #2: Fetch club details for names
│   ├── useEffect #3: Fetch initial messages when club changes
│   └── useEffect #4: Set up polling interval (2 seconds)
│
├── 🛠️ Functions
│   ├── fetchMessages()          // Initial load
│   ├── pollMessages()           // Check for new messages
│   ├── handleSendMessage()      // Send a message
│   ├── handleKeyPress()         // Enter key support
│   ├── handleClubChange()       // Switch clubs
│   ├── scrollToBottom()         // Auto-scroll
│   ├── formatTime()             // Format timestamps
│   └── getInitials()            // Avatar fallback
│
└── 🎨 UI Render
    ├── Loading State (Skeleton)
    ├── No Clubs State (Call to action)
    └── Chat UI
        ├── Header Card
        │   ├── Icon & Title
        │   ├── Club Selector (if multiple)
        │   ├── Live Badge
        │   └── Current Room Display
        ├── Messages Card
        │   ├── Error Banner (if any)
        │   ├── Message List (ScrollArea)
        │   │   ├── Empty State
        │   │   └── Message Items
        │   │       ├── Avatar
        │   │       ├── Name & Time
        │   │       └── Message Bubble
        │   └── Input Section
        │       ├── Text Input
        │       └── Send Button
        └── Auto-scroll Target (ref)
```

## 🔐 Security & Access Control

```
┌─────────────────────────────────────────────────────┐
│              REQUEST TO /student/chat                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  ProtectedRoute HOC    │
        │  allowedRoles:         │
        │  ["student"]           │
        └──────────┬─────────────┘
                   │
           ┌───────┴────────┐
           │                │
       ❌ NO           ✅ YES
    ┌───────────┐   ┌──────────────┐
    │ Redirect  │   │ Check clubIds │
    │ to login  │   │ in localStorage│
    └───────────┘   └───────┬──────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
              ❌ EMPTY           ✅ HAS IDs
          ┌──────────────┐   ┌─────────────────┐
          │ Show message:│   │ Load chat page  │
          │ "Join a club"│   │ Allow access    │
          └──────────────┘   └────────┬────────┘
                                      │
                                      ▼
                          ┌────────────────────┐
                          │ API calls to       │
                          │ /api/chat/*        │
                          │ include JWT token  │
                          └────────┬───────────┘
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                     ❌ Invalid         ✅ Valid
                  ┌──────────┐      ┌────────────┐
                  │ 401/403  │      │ Return data│
                  │ Error    │      │ for clubId │
                  └──────────┘      └────────────┘
```

## 🎮 User Scenarios

### Scenario 1: New Student Joins First Club

```
1. Student registers → no clubs
2. Sidebar: Chat menu is HIDDEN ❌
3. Student applies to join a club
4. Application approved → clubIds: [1]
5. Student logs out and logs back in
6. Sidebar: Chat menu APPEARS ✅
7. Click Chat → Auto-connects to Club 1
8. No selector shown (only one club)
```

### Scenario 2: Student Joins Multiple Clubs

```
1. Student is member of Club 1 (clubIds: [1])
2. Chat menu shows → connects to Club 1
3. Student joins Club 5 and Club 7
4. Student logs out and logs back in (clubIds: [1,5,7])
5. Chat page now shows club selector dropdown
6. Dropdown shows: "Club Alpha", "Club Beta", "Club Gamma"
7. Student selects "Club Beta" (ID: 5)
8. Messages load for Club Beta
9. Student switches to "Club Gamma" (ID: 7)
10. Messages update to Club Gamma's chat
```

### Scenario 3: Real-time Communication

```
Timeline:

00:00 - Club Leader sends: "Meeting today at 3PM"
00:02 - Student A's browser polls → sees message
00:05 - Student B sends: "Confirmed, I'll be there!"
00:07 - Both Leader and Student A poll → see Student B's message
00:10 - Student A sends: "Me too!"
00:12 - All participants see Student A's message

[Every participant polls every 2 seconds]
```

## 📊 State Transitions

```
INITIAL STATE
     │
     ▼
┌─────────────┐
│  Loading    │  (Fetching clubIds from localStorage)
└─────┬───────┘
      │
      ├──────────┐
      │          │
  NO CLUBS    HAS CLUBS
      │          │
      ▼          ▼
┌──────────┐  ┌──────────────┐
│ No Club  │  │ Loading Msgs │
│ Message  │  └──────┬───────┘
└──────────┘         │
                     ▼
              ┌──────────────┐
              │   Ready      │ ←──┐
              │ (Chat Active)│    │
              └──────┬───────┘    │
                     │             │
                     ├─────────────┘
                     │  Polling Loop
                     │  (every 2 sec)
                     │
                     ├── Sending Message ──→ Success/Error
                     │
                     └── Switch Club ──→ Loading Msgs
```

## 🧩 Integration Points

### With Sidebar:
- `components/sidebar.tsx` checks `hasClubs` state
- Shows/hides Chat menu item dynamically
- Menu appears between "Events" and "Check In"

### With Auth System:
- Uses `useAuth()` hook for current user
- Reads from `localStorage["uniclub-auth"]`
- Sends JWT token with API requests

### With Club API:
- Uses `useClubs()` to get all clubs
- Uses `useClub(id)` to get specific club details
- Filters clubs by student's membership IDs

### With Chat API:
- Shares same endpoints as club leader
- Messages isolated by `clubId` parameter
- Upstash Redis stores messages per club

---

## 📈 Performance Optimizations

1. **React Query Caching**
   - Club data cached across navigations
   - Reduces redundant API calls

2. **Conditional Polling**
   - Only polls when clubId is selected
   - Stops polling when page unmounted

3. **Optimistic Updates**
   - Messages appear immediately after sending
   - No wait for server confirmation

4. **Lazy Loading**
   - Only loads messages for selected club
   - Doesn't preload all clubs' messages

5. **Efficient Re-renders**
   - Uses `useCallback` for stable function references
   - Minimizes unnecessary component updates

---

**Architecture Version**: 1.0  
**Last Updated**: October 30, 2025  
**Status**: ✅ Production Ready

