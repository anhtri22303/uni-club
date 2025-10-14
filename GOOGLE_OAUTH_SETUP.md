# Google OAuth Setup Guide

## 🎯 Tổng quan

Dự án đã được tích hợp Google OAuth Login với cấu trúc sau:
- **Frontend**: Sử dụng Google Identity Services (không cần thư viện thêm)
- **Backend**: API `/auth/google` xử lý Google ID token
- **Flow**: FE → Google → BE → JWT của hệ thống

## 📦 Cài đặt Dependencies (Tùy chọn)

Nếu bạn muốn sử dụng thư viện `@react-oauth/google` thay vì Google Identity Services trực tiếp:

```bash
npm install @react-oauth/google
# hoặc
pnpm add @react-oauth/google
```

## 🔧 Cấu hình

### 1. Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google+ API và Google Identity Services
4. Tạo OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**: Không cần thiết cho client-side flow

### 2. Environment Variables
Tạo file `.env.local` (nếu chưa có):

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=69239768097-t0akr44a3jmif9srfoc1p23h6g47kdel.apps.googleusercontent.com
```

### 3. Backend Configuration
Đảm bảo backend có endpoint `/auth/google` nhận request:

```json
POST /auth/google
{
  "token": "google_id_token_here"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "userId": 123,
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "student"
  }
}
```

## 🎮 Sử dụng

### Cách 1: Sử dụng component có sẵn (Đề xuất)

```jsx
import { GoogleSignInButton } from "@/components/GoogleSignInButton"

function LoginPage() {
  return (
    <div>
      <GoogleSignInButton mode="sign-in" />
      {/* hoặc */}
      <GoogleSignInButton mode="sign-up" />
    </div>
  )
}
```

### Cách 2: Sử dụng thư viện @react-oauth/google (Nếu cài)

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { useAuth } from "@/contexts/auth-context"

function LoginPage() {
  const { loginWithGoogle } = useAuth()

  const handleSuccess = async (credentialResponse) => {
    const success = await loginWithGoogle(credentialResponse.credential)
    if (success) {
      console.log("Login successful!")
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Login Failed')} />
    </GoogleOAuthProvider>
  )
}
```

### Cách 3: Custom implementation

```jsx
import { useAuth } from "@/contexts/auth-context"

function CustomGoogleButton() {
  const { loginWithGoogle } = useAuth()

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await loginWithGoogle(response.credential)
        }
      })
    }
    document.head.appendChild(script)
  }, [])

  return <div id="google-signin-button"></div>
}
```

## 🔄 Auth Flow

1. **User clicks "Sign in with Google"**
2. **Google popup opens** → User selects account
3. **Google returns ID token** to frontend
4. **Frontend calls** `loginWithGoogle(token)` từ auth context
5. **Auth context calls** `/auth/google` API với token
6. **Backend verifies** token với Google, tạo user nếu cần
7. **Backend returns** JWT của hệ thống UniClub
8. **Frontend saves** JWT và redirect theo role

## 🛠️ Files đã được sửa đổi

- `service/authApi.ts`: Thêm `loginWithGoogleToken()`
- `contexts/auth-context.tsx`: Thêm `loginWithGoogle()` 
- `components/GoogleSignInButton.tsx`: Component Google login hoàn chỉnh
- `app/page.tsx`: Tích hợp Google button vào trang login

## 🚨 Lưu ý

1. **Client ID**: Hiện tại đang dùng client ID test, cần thay bằng client ID của project thật
2. **HTTPS**: Production cần HTTPS để Google OAuth hoạt động
3. **Domain whitelist**: Cần add domain production vào Google Console
4. **Security**: Không commit client ID vào git public repository

## 🔍 Debug

Nếu gặp lỗi, kiểm tra:

1. **Console errors**: Mở Developer Tools → Console
2. **Network tab**: Kiểm tra request `/auth/google`
3. **Google Console**: Kiểm tra domain được whitelist
4. **Backend logs**: Kiểm tra xem backend có nhận được token không

## 📚 Tài liệu tham khảo

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)