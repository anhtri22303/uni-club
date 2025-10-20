# 🚀 Quick Deploy Guide

## TL;DR - Deploy ngay trong 5 phút

### 1. Chuẩn Bị (2 phút)
```bash
# Tạo .env.local file
cp .env.example .env.local

# Edit .env.local và thêm Google Client ID thật
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com

# Commit changes
git add .
git commit -m "feat: prepare for Vercel deployment with env vars"
git push
```

### 2. Deploy (2 phút)
1. Vào [vercel.com/new](https://vercel.com/new)
2. Import `uni-club` repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### 3. Config Environment Variables (1 phút)
Trong Vercel Dashboard → Settings → Environment Variables, thêm:

```
NEXT_PUBLIC_API_URL = https://uniclub-qyn9a.ondigitalocean.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID = 787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com
```

Apply to: **Production, Preview, Development**

### 4. Redeploy
Vercel Dashboard → Deployments → Latest → ⋯ → Redeploy

---

## ✅ Post-Deploy Tasks

### Update Google OAuth
[Google Cloud Console](https://console.cloud.google.com) → OAuth Consent → Add URIs:
```
https://your-app.vercel.app
https://your-app-*.vercel.app
```

### Update Backend CORS
Add Vercel domain to allowed origins in backend.

---

## 🎉 Done!
Visit `https://your-app.vercel.app`

---

Chi tiết đầy đủ: [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md)
