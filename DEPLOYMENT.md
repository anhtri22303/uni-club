# Deployment Guide

Complete guide for deploying UniClub to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- Node.js 18+
- pnpm 8+
- Git
- Access to backend API
- Domain name (optional)

### Access Requirements

- GitHub repository access
- Hosting platform account (Vercel/AWS/etc.)
- Environment variables (contact team)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/anhtri22303/uni-club.git
cd uni-club
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env.production` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.uniclub.id.vn

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-production-jwt-secret

# OAuth (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_WALLET=true
```

## Build Process

### Local Build Test

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# View at http://localhost:3000
```

### Build Verification

Check build output for:
- ✅ No build errors
- ✅ No TypeScript errors
- ✅ Reasonable bundle sizes
- ✅ All routes generated correctly

```bash
# Example output
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87.3 kB
├ ○ /admin                               312 B          95.1 kB
├ ○ /club-leader                         245 B          93.2 kB
└ ○ /student                             198 B          91.8 kB
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Built for Next.js
- Zero-config deployment
- Automatic HTTPS
- Edge network
- Free tier available

**Steps:**

1. **Install Vercel CLI**
```bash
pnpm add -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel
```

4. **Configure Environment Variables**
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add all variables from `.env.production`

5. **Set Custom Domain (Optional)**
- Go to Project Settings → Domains
- Add your custom domain (e.g., uniclub.id.vn)
- Follow DNS configuration instructions

**Automatic Deployments:**

Connect GitHub repository for automatic deployments:
- Push to `main` → Production deployment
- Push to other branches → Preview deployment

### Option 2: AWS Amplify

**Steps:**

1. **Install AWS Amplify CLI**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify**
```bash
amplify init
```

3. **Add Hosting**
```bash
amplify add hosting
# Choose: Hosting with Amplify Console (Managed hosting)
```

4. **Deploy**
```bash
amplify publish
```

### Option 3: Docker + Any Cloud Provider

**Create Dockerfile:**

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and Run:**

```bash
# Build Docker image
docker build -t uniclub-frontend .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=your-api-url uniclub-frontend
```

**Deploy to:**
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

### Option 4: Traditional VPS (Ubuntu)

**Steps:**

1. **SSH into server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js and pnpm**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

3. **Clone and setup**
```bash
git clone https://github.com/anhtri22303/uni-club.git
cd uni-club
pnpm install
```

4. **Build**
```bash
pnpm build
```

5. **Setup PM2 for process management**
```bash
npm install -g pm2
pm2 start pnpm --name "uniclub" -- start
pm2 save
pm2 startup
```

6. **Setup Nginx as reverse proxy**
```nginx
server {
    listen 80;
    server_name uniclub.id.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d uniclub.id.vn
```

## Environment Variables

### Required Variables

```env
# API Endpoint (REQUIRED)
NEXT_PUBLIC_API_URL=https://api.uniclub.id.vn

# JWT Secret (REQUIRED)
NEXT_PUBLIC_JWT_SECRET=your-secret-key-min-32-chars
```

### Optional Variables

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://uniclub.id.vn/auth/google/callback

# MoMo Payment
NEXT_PUBLIC_MOMO_PARTNER_CODE=your-momo-partner-code

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_WALLET=true
NEXT_PUBLIC_ENABLE_FEEDBACK=true

# Debugging
NEXT_PUBLIC_DEBUG_MODE=false
```

### Security Best Practices

- ❌ Never commit `.env` files
- ✅ Use platform-specific secret management
- ✅ Rotate secrets regularly
- ✅ Use different secrets for staging/production
- ✅ Restrict access to environment variables

## Post-Deployment Checklist

### Functionality Tests

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Google OAuth works
  - [ ] Password reset works
  - [ ] Logout works

- [ ] **Role-based Access**
  - [ ] Admin dashboard accessible
  - [ ] Club leader features work
  - [ ] University staff pages load
  - [ ] Student pages function

- [ ] **Core Features**
  - [ ] Event creation/management
  - [ ] Club registration
  - [ ] Attendance check-in
  - [ ] Wallet/points system
  - [ ] Product redemption

- [ ] **UI/UX**
  - [ ] Responsive on mobile
  - [ ] Dark mode works
  - [ ] Loading states display
  - [ ] Error messages show

### Performance Checks

```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://uniclub.id.vn --view
```

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Security Checks

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] No sensitive data in client-side code
- [ ] API calls use authentication
- [ ] CORS configured correctly

### Monitoring Setup

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Google Analytics)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)

## Monitoring

### Error Tracking (Sentry - Recommended)

1. **Install Sentry**
```bash
pnpm add @sentry/nextjs
```

2. **Configure**
```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. **Add to Vercel**
- Environment variable: `NEXT_PUBLIC_SENTRY_DSN`

### Uptime Monitoring

**UptimeRobot (Free):**
1. Create account at uptimerobot.com
2. Add monitor for https://uniclub.id.vn
3. Set check interval: 5 minutes
4. Configure alerts (email/SMS)

### Analytics

**Google Analytics:**
```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  )
}
```

## Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

**Error: "Out of memory"**
```bash
# Solution: Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### Runtime Issues

**Error: "API calls failing"**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify API is accessible from deployment server
- Check CORS configuration on backend

**Error: "Authentication not working"**
- Verify JWT secret matches backend
- Check token expiration times
- Ensure cookies are being set correctly

**Error: "404 on refresh"**
- Configure server for client-side routing
- For Nginx: `try_files $uri $uri/ /index.html;`

### Performance Issues

**Slow page loads:**
```bash
# Analyze bundle size
pnpm add -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run analysis
ANALYZE=true pnpm build
```

**High memory usage:**
- Check for memory leaks
- Optimize images
- Reduce bundle size
- Enable caching

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Docker

```bash
# Pull previous image
docker pull uniclub-frontend:previous-tag

# Stop current container
docker stop uniclub-frontend

# Start with previous image
docker run -d --name uniclub-frontend uniclub-frontend:previous-tag
```

### Git-based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit (use carefully)
git reset --hard commit-hash
git push origin main --force
```

## Support

For deployment issues:
- **Email:** anhtri22303@gmail.com
- **Documentation:** Check this guide first
- **Team Chat:** Contact development team

---

**Last Updated:** December 14, 2025  
**Maintained By:** UniClub DevOps Team
