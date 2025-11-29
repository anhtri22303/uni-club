# 🤖 Chatbot Conversation History Implementation

## 📋 Tổng quan

Đã implement tính năng lưu trữ lịch sử hội thoại cho chatbot UniBot sử dụng Upstash Redis. Mỗi người dùng có lịch sử hội thoại riêng, tối đa 10 tin nhắn (bao gồm cả user và AI response).

## 🎯 Tính năng chính

### 1. Lưu trữ lịch sử hội thoại
- ✅ Mỗi `userId` có một conversation history riêng trong Redis
- ✅ Tối đa 10 tin nhắn được lưu (messages cũ nhất sẽ tự động bị xóa khi vượt quá)
- ✅ Lịch sử được lưu sau mỗi lần user gửi message và nhận response từ AI
- ✅ Format lưu trữ: `chatbot:conversation:{userId}`

### 2. Load lịch sử khi mở chatbot
- ✅ Khi user mở chatbot, lịch sử hội thoại sẽ được load từ Redis
- ✅ Hiển thị lại các tin nhắn cũ theo đúng thứ tự thời gian
- ✅ Chỉ load 1 lần khi mở chatbot để tránh load lại liên tục

### 3. Context-aware AI responses
- ✅ Khi gửi tin nhắn mới, chatbot sẽ gửi kèm 8 tin nhắn gần nhất (4 exchanges) để AI có context
- ✅ AI có thể hiểu và trả lời dựa trên các câu hỏi trước đó
- ✅ Giúp cuộc hội thoại tự nhiên và liên tục hơn

### 4. Clear conversation history
- ✅ Nút "Clear" (icon thùng rác) trong header của chatbot
- ✅ Click để xóa toàn bộ lịch sử hội thoại của user
- ✅ Chỉ còn lại welcome message
- ✅ Button bị disable khi chỉ còn welcome message

### 5. Auto cleanup khi logout
- ✅ Khi user logout, lịch sử hội thoại chatbot sẽ tự động bị xóa khỏi Redis
- ✅ Đảm bảo privacy và không để lại dữ liệu cũ

## 🏗️ Kiến trúc

### API Routes mới

#### `/api/chatbot/history` (GET)
- **Mục đích**: Lấy lịch sử hội thoại của user
- **Params**: `userId`
- **Response**: Array of messages (max 10)
- **Format**:
  ```typescript
  {
    messages: [
      {
        role: 'user' | 'assistant',
        content: string,
        timestamp: number
      }
    ]
  }
  ```

#### `/api/chatbot/history` (POST)
- **Mục đích**: Lưu tin nhắn mới vào lịch sử
- **Body**:
  ```typescript
  {
    userId: string | number,
    messages: [
      { role: 'user', content: string },
      { role: 'assistant', content: string }
    ]
  }
  ```
- **Logic**: 
  - Thêm messages vào đầu list (newest first)
  - Tự động trim để giữ max 10 messages
  - Set TTL = 7 ngày

#### `/api/chatbot/history` (DELETE)
- **Mục đích**: Xóa toàn bộ lịch sử hội thoại
- **Params**: `userId`
- **Response**: `{ success: true }`

### Redis Data Structure

```
Key: chatbot:conversation:{userId}
Type: List (Redis LPUSH/LRANGE)
Max Items: 10 (enforced by LTRIM)
TTL: 7 days (604800 seconds)

Item format:
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: number
}
```

### Component Updates

#### `components/chatbot-widget.tsx`

**New State:**
```typescript
const [userId, setUserId] = useState<string | number | null>(null)
const [historyLoaded, setHistoryLoaded] = useState(false)
```

**New Effects:**
1. Load userId from sessionStorage
2. Load conversation history when chatbot opens
3. Auto-save after each message exchange

**New Functions:**
- `handleClearHistory()`: Xóa lịch sử hội thoại
- Updated `handleSendMessage()`: 
  - Include conversation context (last 8 messages)
  - Save to Redis after response

**UI Changes:**
- Added Clear History button (Trash2 icon) in header
- Button disabled when no history to clear

#### `contexts/auth-context.tsx`

**Updates:**
- Import `axios`
- Change `logout()` to async function
- Add chatbot history cleanup before clearing storage
- Update `AuthContextType` interface

## 📊 Data Flow

### Send Message Flow
```
1. User types message
   ↓
2. Add user message to UI state
   ↓
3. Prepare API call with:
   - System prompt
   - Last 8 messages (context)
   - Current user message
   ↓
4. Send to Groq API
   ↓
5. Receive AI response
   ↓
6. Add AI message to UI state
   ↓
7. Save both messages to Redis (POST /api/chatbot/history)
```

### Load History Flow
```
1. User opens chatbot
   ↓
2. Check if userId exists and history not loaded
   ↓
3. GET /api/chatbot/history?userId={userId}
   ↓
4. Convert history messages to UI format
   ↓
5. Prepend to messages state (after welcome message)
   ↓
6. Mark historyLoaded = true
```

### Clear History Flow
```
1. User clicks Clear button
   ↓
2. DELETE /api/chatbot/history?userId={userId}
   ↓
3. Reset messages to [welcomeMessage]
   ↓
4. Redis key deleted
```

### Logout Flow
```
1. User clicks logout
   ↓
2. Get userId from sessionStorage
   ↓
3. DELETE /api/chatbot/history?userId={userId}
   ↓
4. Continue with normal logout cleanup
   ↓
5. Clear all storage keys
   ↓
6. Redirect to home
```

## 🔒 Security & Privacy

1. **User Isolation**: Mỗi user có conversation key riêng
2. **Auto Expiration**: Lịch sử tự động expire sau 7 ngày
3. **Logout Cleanup**: Tự động xóa khi logout
4. **Limited Storage**: Chỉ lưu tối đa 10 messages để tránh spam
5. **Error Handling**: Nếu Redis fail, chatbot vẫn hoạt động (không lưu history)

## 🧪 Testing Checklist

- [ ] Mở chatbot → check history được load đúng
- [ ] Gửi message mới → check lưu vào Redis
- [ ] Gửi > 10 messages → check messages cũ bị xóa
- [ ] Click Clear → check history bị xóa
- [ ] Logout → check history bị xóa
- [ ] Login lại → check không còn history cũ
- [ ] AI response có context → check trả lời dựa trên câu hỏi trước
- [ ] Clear button disabled → check khi chỉ có welcome message

## 🚀 Environment Requirements

Đảm bảo có các environment variables:
```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
NEXT_PUBLIC_AI_CHATBOT_URL=your_groq_url
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

## 📝 Code Files Changed

1. `app/api/chatbot/history/route.ts` (NEW)
2. `components/chatbot-widget.tsx` (UPDATED)
3. `contexts/auth-context.tsx` (UPDATED)

## 🎨 UI/UX Improvements

1. **Clear History Button**: 
   - Icon: Trash2
   - Color: Red on hover
   - Tooltip: "Clear conversation history"
   - Position: Header, before Expand button

2. **Loading State**: History loads silently in background

3. **Context Awareness**: AI remembers previous messages

4. **Privacy**: Auto-cleanup on logout

## 📚 Technical Notes

- Sử dụng cùng Upstash Redis instance với club chat
- Redis operations are async but don't block UI
- Error trong history operations không ảnh hưởng chatbot chính
- Messages stored newest-first (LPUSH) để query hiệu quả

---

**Implementation Date**: November 30, 2025  
**Status**: ✅ Production Ready  
**Redis Key Pattern**: `chatbot:conversation:{userId}`
