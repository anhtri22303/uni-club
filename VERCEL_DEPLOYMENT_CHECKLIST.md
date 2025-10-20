# 🚀 Vercel Deployment Checklist

## ✅ Những Gì Đã Sẵn Sàng

1. **`vercel.json`** - Build configuration ✅
2. **`next.config.mjs`** - Next.js config với CORS headers ✅
3. **`.gitignore`** - Đã ignore `.env*` files ✅
4. **Package Manager** - Sử dụng pnpm ✅
5. **TypeScript** - Configured properly ✅

---

## ⚠️ Những Gì CẦN CHỈNH

### 1. Environment Variables - **QUAN TRỌNG!**

**Vấn đề hiện tại:**
- `axiosInstance.ts` đang hardcode API URL: `https://uniclub-qyn9a.ondigitalocean.app/`
- `GoogleAuthProvider.tsx` có fallback hardcode Client ID

**Giải pháp:**

#### Bước 1: Tạo file `.env.local` (local development)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://uniclub-qyn9a.ondigitalocean.app

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com
```

#### Bước 2: Tạo file `.env.example` (documentation)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=your_api_url_here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### Bước 3: Update `axiosInstance.ts`
Thay vì hardcode, dùng environment variable:

```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://uniclub-qyn9a.ondigitalocean.app/",
  timeout: 10000,
})
```

#### Bước 4: Config trên Vercel Dashboard
1. Vào project settings trên Vercel
2. Settings → Environment Variables
3. Thêm:
   - `NEXT_PUBLIC_API_URL` = `https://uniclub-qyn9a.ondigitalocean.app`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = `787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com`

---

### 2. Build Errors - Cần Fix

**Vấn đề:**
```json
"typescript": {
  "ignoreBuildErrors": true
}
```

**Rủi ro:**
- Có thể skip type errors quan trọng
- Production có thể break unexpectedly

**Khuyến nghị:** Fix các type errors trước khi deploy
- Chạy `pnpm build` locally
- Fix tất cả errors
- Set `ignoreBuildErrors: false` cho production

---

### 3. Console Logs - Nên Clean Up

**Vấn đề hiện tại:**
Next.config đã remove console trong production, nhưng giữ lại `error` và `warn`.

**Tốt:**
```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === "production" ? {
    exclude: ["error", "warn"]
  } : false,
}
```

**Khuyến nghị:** Giữ nguyên config này, nhưng đảm bảo không có sensitive info trong logs.

---

### 4. API CORS - Cần Verify

**Điểm cần kiểm tra:**

Backend API (`https://uniclub-qyn9a.ondigitalocean.app`) cần cho phép requests từ:
```
https://your-app.vercel.app
https://your-app-*.vercel.app (preview deployments)
```

**Backend CORS config cần có:**
```java
// Example for Spring Boot
@CrossOrigin(origins = {
  "https://your-app.vercel.app",
  "https://*.vercel.app"
})
```

---

### 5. Google OAuth Redirect URIs

**Cần thêm vào Google Cloud Console:**
1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Chọn OAuth 2.0 Client ID
4. Thêm Authorized redirect URIs:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/*
   https://your-app-*.vercel.app (cho preview deployments)
   ```

---

## 📋 Deployment Steps

### Step 1: Prepare Code
```bash
# 1. Update axiosInstance.ts to use env variable
# 2. Create .env.local and .env.example
# 3. Commit changes
git add .
git commit -m "feat: prepare for Vercel deployment"
git push
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: Via Vercel Dashboard
1. Vào [vercel.com](https://vercel.com)
2. Import Git Repository
3. Select `uni-club` repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next`
5. Add Environment Variables (xem phần 1)
6. Deploy!

### Step 3: Post-Deployment

1. **Test URL**: `https://your-app.vercel.app`
2. **Check:**
   - ✅ Login works
   - ✅ API calls work
   - ✅ Navigation is fast
   - ✅ React Query caching works
   - ✅ Google OAuth works

3. **Configure Custom Domain** (optional):
   - Vercel Dashboard → Domains
   - Add your domain
   - Update DNS settings

---

## 🔧 Recommended Fixes

### Fix 1: Update axiosInstance.ts
```typescript
import axios from "axios"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://uniclub-qyn9a.ondigitalocean.app/",
  timeout: 10000,
})

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jwtToken")
      if (token) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default axiosInstance
```

### Fix 2: Create .env.example
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://uniclub-qyn9a.ondigitalocean.app

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
```

### Fix 3: Create .env.local (Don't commit!)
```bash
# Development
NEXT_PUBLIC_API_URL=https://uniclub-qyn9a.ondigitalocean.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com
```

---

## 🎯 Vercel Environment Variables Setup

Sau khi deploy, set environment variables:

```
Key: NEXT_PUBLIC_API_URL
Value: https://uniclub-qyn9a.ondigitalocean.app
Environments: Production, Preview, Development

Key: NEXT_PUBLIC_GOOGLE_CLIENT_ID  
Value: 787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com
Environments: Production, Preview, Development
```

---

## ⚡ Performance Optimizations (Already Done!)

### ✅ React Query
- Caching enabled
- Prefetching on hover
- Auto refetch on focus

### ✅ Next.js Config
- Image optimization
- Package imports optimization
- Console removal in production

### ✅ Build Settings
- TypeScript configured
- ESLint configured
- Proper build commands

---

## 🧪 Testing After Deploy

### Checklist
- [ ] App loads at `https://your-app.vercel.app`
- [ ] Login with Google works
- [ ] API calls to DigitalOcean backend work
- [ ] Navigation is instant (React Query cache)
- [ ] Hover prefetching works
- [ ] All pages load correctly
- [ ] Mobile responsive
- [ ] No console errors (F12)

### Performance Test
```javascript
// Run in browser console
console.clear()
console.time('Page Load')
// Navigate to any page
console.timeEnd('Page Load')
// Should be < 100ms for cached pages
```

---

## 🚨 Common Issues

### Issue 1: API Calls Fail (CORS)
**Solution:** Update backend CORS to allow Vercel domain

### Issue 2: Google Login Fails
**Solution:** Add Vercel URL to Google OAuth redirect URIs

### Issue 3: Environment Variables Not Working
**Solution:** 
- Ensure they start with `NEXT_PUBLIC_`
- Redeploy after adding env vars
- Clear browser cache

### Issue 4: Build Fails
**Solution:**
- Check build logs in Vercel
- Fix TypeScript errors
- Ensure all dependencies in package.json

---

## 📊 Expected Performance

### After Deploy to Vercel

| Metric | Expected |
|--------|----------|
| **First Load** | < 2s |
| **Cached Page** | < 100ms |
| **API Calls** | Depends on backend |
| **Lighthouse Score** | > 90 |

### With Vercel Edge Network
- ⚡ Global CDN
- ⚡ Automatic SSL
- ⚡ DDoS protection
- ⚡ Analytics built-in

---

## 🎉 Summary

### Cần Làm TRƯỚC KHI Deploy:
1. ✅ Update `axiosInstance.ts` to use env variable
2. ✅ Create `.env.example` file
3. ✅ Create `.env.local` for local dev
4. ✅ Commit and push to GitHub

### Cần Làm TRONG QUÁTRÌNH Deploy:
1. ✅ Set environment variables on Vercel
2. ✅ Configure build settings (already OK)
3. ✅ Deploy!

### Cần Làm SAU KHI Deploy:
1. ✅ Update Google OAuth redirect URIs
2. ✅ Update backend CORS settings
3. ✅ Test all functionality
4. ✅ Monitor performance

---

**Kết luận:** App đã gần như sẵn sàng! Chỉ cần:
1. Update axiosInstance.ts (env variable)
2. Create .env files
3. Deploy và config env vars trên Vercel
4. Update OAuth settings

Sau đó app sẽ live với performance tối ưu! 🚀
