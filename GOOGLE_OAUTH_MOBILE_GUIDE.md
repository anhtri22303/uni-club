# 📱 Hướng Dẫn Triển Khai Google OAuth Login cho Mobile

> **Tài liệu này mô tả chi tiết cách thức hoạt động của Google OAuth trong web app hiện tại để bạn có thể triển khai tương tự cho mobile app.**

---

## 🎯 Tổng Quan Luồng Hoạt Động

```
┌─────────────┐        ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Client    │        │   Google     │         │  Frontend   │         │   Backend    │
│  (Mobile)   │───────▶│   OAuth      │────────▶│   Handler   │────────▶│   API        │
└─────────────┘        └──────────────┘         └─────────────┘         └──────────────┘
     │                        │                        │                        │
     │  1. Khởi tạo          │                        │                        │
     │     Google Sign-In    │                        │                        │
     │─────────────────────▶│                        │                        │
     │                        │                        │                        │
     │  2. Người dùng đăng   │                        │                        │
     │     nhập Google       │                        │                        │
     │◀─────────────────────│                        │                        │
     │                        │                        │                        │
     │  3. Nhận ID Token     │                        │                        │
     │     (JWT)              │                        │                        │
     │◀─────────────────────│                        │                        │
     │                        │                        │                        │
     │  4. Gửi ID Token      │                        │                        │
     │     đến backend       │                        │                        │
     │──────────────────────────────────────────────▶│                        │
     │                        │                        │                        │
     │                        │                        │  5. POST /auth/google │
     │                        │                        │     { token: "..." }  │
     │                        │                        │───────────────────────▶│
     │                        │                        │                        │
     │                        │                        │  6. Backend verify    │
     │                        │                        │     token với Google  │
     │                        │                        │◀──────────────────────│
     │                        │                        │                        │
     │  7. Nhận JWT token    │                        │                        │
     │     + user info        │                        │                        │
     │◀──────────────────────────────────────────────│◀──────────────────────│
```

---

## 🔑 1. GOOGLE CLIENT ID

### **Client ID Hiện Tại (Web)**
```
772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com
```

### **⚠️ LƯU Ý QUAN TRỌNG CHO MOBILE:**

**BẠN CẦN TẠO CLIENT ID MỚI CHO MOBILE** tại [Google Cloud Console](https://console.cloud.google.com/)

#### **Các loại Client ID cần thiết:**

1. **Android Client ID** (nếu build cho Android)
   - Cần: Package name và SHA-1 certificate fingerprint
   - Ví dụ: `772231604776-xxxxx.apps.googleusercontent.com`

2. **iOS Client ID** (nếu build cho iOS)  
   - Cần: Bundle ID
   - Ví dụ: `772231604776-yyyyy.apps.googleusercontent.com`

3. **Web Client ID** (dùng để verify token ở backend)
   - **SỬ DỤNG CHUNG** với web app hiện tại
   - `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`

### **Cách tạo Client ID mới:**

```bash
# Truy cập Google Cloud Console
https://console.cloud.google.com/apis/credentials

# Chọn project: uni-club (hoặc tương ứng)
# Tạo credentials mới:
- Chọn "Create Credentials" → "OAuth 2.0 Client ID"
- Application type: Android/iOS
- Điền package name/bundle ID và SHA-1 (cho Android)
```

---

## 🔧 2. CẤU HÌNH MÔI TRƯỜNG

### **Web App (Next.js) - Tham khảo**
```env
# .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://uniclub-qyn9a.ondigitalocean.app/
```

### **Mobile App (Flutter/React Native) - Đề xuất**
```env
# .env hoặc config file
GOOGLE_WEB_CLIENT_ID=772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=772231604776-xxxxx.apps.googleusercontent.com  # Tạo mới
GOOGLE_IOS_CLIENT_ID=772231604776-yyyyy.apps.googleusercontent.com      # Tạo mới
API_BASE_URL=https://uniclub-qyn9a.ondigitalocean.app/
```

---

## 📡 3. API ENDPOINT

### **Endpoint Login với Google**
```
POST /auth/google
```

### **Request Format**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWI..."
}
```

**Lưu ý:** `token` là **Google ID Token (JWT)** nhận được từ Google Sign-In

### **Response Success (200 OK)**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "avatar": "https://lh3.googleusercontent.com/...",
    "userId": 12345,
    "role": "student",
    "staff": false,
    "clubIds": [1, 2, 3]
  }
}
```

### **Response Error (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid Google token",
  "data": null
}
```

### **Response Error (400 Bad Request)**
```json
{
  "success": false,
  "message": "Missing required parameter: token",
  "data": null
}
```

---

## 💻 4. CODE IMPLEMENTATION - WEB (Tham Khảo)

### **4.1. Provider Setup (GoogleAuthProvider.tsx)**

```typescript
import { GoogleOAuthProvider } from '@react-oauth/google'

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
    "772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com"
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
```

### **4.2. Google Sign-In Button (GoogleSignInButton.tsx)**

```typescript
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
  try {
    // 1. Nhận ID Token từ Google
    const idToken = credentialResponse.credential
    
    if (!idToken) {
      throw new Error("No credential received from Google")
    }
    
    console.log("   Received Google ID Token:", idToken.substring(0, 30) + "...")
    
    // 2. Gửi ID Token đến backend
    const success = await loginWithGoogle(idToken)
    
    if (success) {
      console.log("   Login successful")
      // Navigate to dashboard
    }
  } catch (error) {
    console.error("  Google login error:", error)
  }
}

// Render button
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={() => console.error("Google Sign-In failed")}
  text="signin_with"
  theme="outline"
  size="large"
/>
```

### **4.3. API Call (authApi.ts)**

```typescript
import axiosInstance from "../lib/axiosInstance"

interface GoogleAuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    email: string
    fullName: string
    avatar?: string
    userId?: number | string
    role?: string
    staff?: boolean
    clubIds?: number[]
  }
}

export const loginWithGoogleToken = async (
  credentials: { token: string }
): Promise<LoginResponse> => {
  try {
    // POST request to backend
    const response = await axiosInstance.post<GoogleAuthResponse>(
      "/auth/google", 
      credentials
    )
    
    // Check response
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Google authentication failed")
    }
    
    // Transform response
    const userData = response.data.data
    return {
      token: userData.token,
      userId: userData.userId || 0,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role || "student",
      staff: userData.staff || false,
      clubIds: userData.clubIds || [],
    }
  } catch (error: any) {
    console.error("  Google Login API Error:", error.response?.data)
    throw error
  }
}
```

### **4.4. Auth Context (auth-context.tsx)**

```typescript
const loginWithGoogle = async (googleToken: string): Promise<boolean> => {
  try {
    // Call API
    const res = await loginWithGoogleToken({ token: googleToken })
    
    // Save JWT token
    sessionStorage.setItem("jwtToken", res.token)
    localStorage.setItem("jwtToken", res.token)
    
    // Save user info
    sessionStorage.setItem("userRole", res.role)
    localStorage.setItem("userRole", res.role)
    
    // Update auth state
    setAuth({
      userId: res.userId,
      role: res.role,
      staff: res.staff,
      user: {
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
      }
    })
    
    // Navigate based on role
    const redirectMap: Record<string, string> = {
      student: "/profile",
      club_leader: "/club-leader",
      uni_staff: "/uni-staff",
      admin: "/admin",
      staff: "/staff",
    }
    const path = redirectMap[res.role] || "/profile"
    router.push(path)
    
    return true
  } catch (error) {
    console.error("Google login failed", error)
    return false
  }
}
```

### **4.5. Axios Interceptor (axiosInstance.ts)**

```typescript
import axios from "axios"

const axiosInstance = axios.create({
  baseURL: "https://uniclub-qyn9a.ondigitalocean.app/",
  timeout: 30000,
})

// Add JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("jwtToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default axiosInstance
```

---

## 📱 5. IMPLEMENTATION CHO MOBILE

### **5.1. Flutter Implementation**

#### **Cài đặt packages**
```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.5
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

#### **Google Sign-In Service**

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  // Web Client ID (dùng để verify token ở backend)
  static const String webClientId = 
    '772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com';
  
  // Android Client ID (tạo mới trong Google Cloud Console)
  static const String androidClientId = 
    '772231604776-xxxxx.apps.googleusercontent.com';
  
  // iOS Client ID (tạo mới trong Google Cloud Console)
  static const String iosClientId = 
    '772231604776-yyyyy.apps.googleusercontent.com';

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // Quan trọng: phải cấu hình serverClientId
    serverClientId: webClientId,
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // 1. Khởi động Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        print('  User cancelled Google Sign-In');
        return null;
      }
      
      print('   Google Sign-In successful: ${googleUser.email}');
      
      // 2. Lấy authentication details
      final GoogleSignInAuthentication googleAuth = 
        await googleUser.authentication;
      
      // 3. Lấy ID Token (JWT) - ĐÂY LÀ TOKEN GỬI ĐẾN BACKEND
      final String? idToken = googleAuth.idToken;
      
      if (idToken == null) {
        print('  Failed to get ID token');
        return null;
      }
      
      print('   Got ID Token: ${idToken.substring(0, 30)}...');
      
      // 4. Gửi ID Token đến backend
      return await _loginWithBackend(idToken);
      
    } catch (error) {
      print('  Google Sign-In error: $error');
      return null;
    }
  }

  Future<Map<String, dynamic>?> _loginWithBackend(String idToken) async {
    const String apiUrl = 
      'https://uniclub-qyn9a.ondigitalocean.app/auth/google';
    
    try {
      print('📤 Sending ID Token to backend...');
      
      // POST request
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': idToken,  // Gửi Google ID Token
        }),
      );
      
      print('📥 Backend response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = 
          jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          print('   Backend authentication successful');
          
          // Lưu JWT token
          final String jwtToken = responseData['data']['token'];
          await _saveToken(jwtToken);
          
          return responseData['data'];
        } else {
          print('  Backend error: ${responseData['message']}');
          return null;
        }
      } else {
        print('  HTTP error: ${response.statusCode}');
        return null;
      }
    } catch (error) {
      print('  Backend API error: $error');
      return null;
    }
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwtToken', token);
    print('💾 JWT token saved to storage');
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwtToken');
    print('🚪 Signed out successfully');
  }
}
```

#### **Usage trong Flutter UI**

```dart
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  final GoogleAuthService _authService = GoogleAuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton.icon(
          icon: Image.asset('assets/google_logo.png', height: 24),
          label: Text('Sign in with Google'),
          onPressed: () async {
            final userData = await _authService.signInWithGoogle();
            
            if (userData != null) {
              // Navigate to home screen
              Navigator.pushReplacementNamed(context, '/home');
              
              // Show success message
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Welcome ${userData['fullName']}!'),
                ),
              );
            } else {
              // Show error
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Sign in failed'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
        ),
      ),
    );
  }
}
```

### **5.2. React Native Implementation**

#### **Cài đặt packages**
```bash
npm install @react-native-google-signin/google-signin
npm install @react-native-async-storage/async-storage
npm install axios
```

#### **Google Sign-In Service**

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://uniclub-qyn9a.ondigitalocean.app';

// Web Client ID (dùng để verify token ở backend)
const WEB_CLIENT_ID = '772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com';

// Android Client ID (tạo mới trong Google Cloud Console)
const ANDROID_CLIENT_ID = '772231604776-xxxxx.apps.googleusercontent.com';

// iOS Client ID (tạo mới trong Google Cloud Console)  
const IOS_CLIENT_ID = '772231604776-yyyyy.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,  // Quan trọng: dùng web client ID
  offlineAccess: true,
  iosClientId: IOS_CLIENT_ID,
});

export const signInWithGoogle = async () => {
  try {
    // 1. Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices();
    
    // 2. Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    console.log('   Google Sign-In successful:', userInfo.user.email);
    
    // 3. Get ID Token
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;
    
    console.log('   Got ID Token:', idToken.substring(0, 30) + '...');
    
    // 4. Send ID Token to backend
    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
      token: idToken,
    });
    
    console.log('📥 Backend response:', response.data);
    
    if (response.data.success) {
      // Save JWT token
      const jwtToken = response.data.data.token;
      await AsyncStorage.setItem('jwtToken', jwtToken);
      
      console.log('💾 JWT token saved');
      
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
    
  } catch (error: any) {
    console.error('  Sign in error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled sign in');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign in in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play services not available');
    }
    
    throw error;
  }
};

export const signOut = async () => {
  try {
    await GoogleSignin.signOut();
    await AsyncStorage.removeItem('jwtToken');
    console.log('🚪 Signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

#### **Usage trong React Native**

```typescript
import React from 'react';
import { View, Button, Alert } from 'react-native';
import { signInWithGoogle } from './services/GoogleAuthService';

const LoginScreen = () => {
  const handleGoogleSignIn = async () => {
    try {
      const userData = await signInWithGoogle();
      
      Alert.alert(
        'Success',
        `Welcome ${userData.fullName}!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Sign in failed. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Sign in with Google"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default LoginScreen;
```

---

## 🔐 6. BẢO MẬT & LƯU Ý

### **6.1. Token Security**

-    **Google ID Token (JWT)**:
  - Token nhận từ Google sau khi user login
  - **Không lưu** token này lâu dài
  - Chỉ dùng để gửi đến backend **1 lần**
  - Hết hạn sau 1 giờ

-    **JWT Token (từ backend)**:
  - Token nhận từ backend sau khi verify Google token
  - **Lưu vào secure storage** (AsyncStorage, SharedPreferences)
  - Gửi kèm trong header `Authorization: Bearer <token>` cho các API calls
  - Backend sẽ verify token này

### **6.2. Token Flow**

```
Google ID Token (JWT)  →  Gửi đến Backend  →  Backend verify với Google
                                                      ↓
                                              Backend tạo JWT Token mới
                                                      ↓
                                              Trả về cho Mobile
                                                      ↓
                                              Lưu vào Secure Storage
                                                      ↓
                                         Dùng cho các API calls tiếp theo
```

### **6.3. Storage Recommendations**

#### **Flutter:**
```dart
// Sử dụng flutter_secure_storage cho production
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Save token
await storage.write(key: 'jwtToken', value: token);

// Read token
final token = await storage.read(key: 'jwtToken');

// Delete token
await storage.delete(key: 'jwtToken');
```

#### **React Native:**
```typescript
// Sử dụng react-native-keychain cho production
import * as Keychain from 'react-native-keychain';

// Save token
await Keychain.setGenericPassword('jwtToken', token);

// Read token
const credentials = await Keychain.getGenericPassword();
if (credentials) {
  const token = credentials.password;
}

// Delete token
await Keychain.resetGenericPassword();
```

### **6.4. API Authorization**

Sau khi login thành công, gửi JWT token trong mọi API request:

```typescript
// Flutter (using http package)
final response = await http.get(
  Uri.parse('$apiUrl/api/profile'),
  headers: {
    'Authorization': 'Bearer $jwtToken',
    'Content-Type': 'application/json',
  },
);

// React Native (using axios)
const response = await axios.get('/api/profile', {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
});
```

---

## 🧪 7. TESTING & DEBUGGING

### **7.1. Test Flow**

1. **Kiểm tra Google Sign-In UI**
   ```
      Button hiển thị đúng
      Click button mở Google Sign-In dialog
      Chọn tài khoản Google
   ```

2. **Kiểm tra ID Token**
   ```dart
   // In ra console
   print('ID Token: ${idToken.substring(0, 50)}...');
   print('Token length: ${idToken.length}');
   ```

3. **Kiểm tra Backend API**
   ```typescript
   console.log('Request:', {
     url: '/auth/google',
     body: { token: idToken.substring(0, 30) + '...' }
   });
   
   console.log('Response:', {
     status: response.status,
     success: response.data.success,
     message: response.data.message,
   });
   ```

4. **Kiểm tra JWT Token lưu trữ**
   ```dart
   // Flutter
   final token = await prefs.getString('jwtToken');
   print('Saved JWT: ${token?.substring(0, 50)}...');
   
   // React Native
   const token = await AsyncStorage.getItem('jwtToken');
   console.log('Saved JWT:', token?.substring(0, 50) + '...');
   ```

### **7.2. Common Errors & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `DEVELOPER_ERROR` | SHA-1 fingerprint không đúng (Android) | Kiểm tra lại SHA-1 trong Google Cloud Console |
| `SIGN_IN_FAILED` | Client ID không đúng | Kiểm tra `webClientId` configuration |
| `401 Unauthorized` | Google token invalid | Token đã hết hạn hoặc không valid |
| `400 Bad Request` | Missing token trong request | Kiểm tra request body format |
| `Network Error` | Không kết nối được backend | Kiểm tra API_BASE_URL và network |

### **7.3. Debug Checklist**

```
□ Google Client IDs đã được tạo (Web, Android, iOS)?
□ SHA-1 fingerprint đã được thêm vào Google Cloud Console? (Android)
□ Bundle ID đã được cấu hình đúng? (iOS)
□ webClientId trong config match với backend?
□ Backend API endpoint đang hoạt động?
□ Request format đúng (có field "token")?
□ Response có field "success" và "data"?
□ JWT token được lưu vào storage?
□ JWT token được gửi trong Authorization header?
```

---

## 📋 8. SETUP CHECKLIST

### **Bước 1: Google Cloud Console**
- [ ] Truy cập [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Chọn project hoặc tạo project mới
- [ ] Enable **Google+ API** hoặc **Google Identity**
- [ ] Tạo **OAuth 2.0 Client IDs**:
  - [ ] Android Client ID (với SHA-1 fingerprint)
  - [ ] iOS Client ID (với Bundle ID)
  - [ ] Web Client ID (hoặc dùng lại: `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`)

### **Bước 2: Mobile Project Setup**

#### **Flutter:**
```bash
# 1. Add dependencies
flutter pub add google_sign_in
flutter pub add http
flutter pub add shared_preferences

# 2. Android: Thêm vào android/app/build.gradle
defaultConfig {
  // ...
  minSdkVersion 21  # Google Sign-In requires min SDK 21
}

# 3. iOS: Không cần config thêm (auto-configured)
```

#### **React Native:**
```bash
# 1. Install packages
npm install @react-native-google-signin/google-signin
npm install @react-native-async-storage/async-storage
npm install axios

# 2. iOS: Install pods
cd ios && pod install && cd ..

# 3. Android: Thêm vào android/build.gradle
buildscript {
  ext {
    googlePlayServicesAuthVersion = "20.7.0"
  }
}
```

### **Bước 3: Code Implementation**
- [ ] Copy code từ section 5 (Flutter/React Native)
- [ ] Update Client IDs
- [ ] Update API_BASE_URL
- [ ] Implement sign-in logic
- [ ] Test flow end-to-end

### **Bước 4: Backend Verification**
- [ ] Confirm backend endpoint: `POST /auth/google`
- [ ] Confirm request format: `{ "token": "<google_id_token>" }`
- [ ] Confirm response format có fields: `success`, `message`, `data`

---

## 🔗 9. RESOURCES & LINKS

### **Documentation**
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Flutter google_sign_in package](https://pub.dev/packages/google_sign_in)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)

### **Backend API**
- Base URL: `https://uniclub-qyn9a.ondigitalocean.app/`
- Endpoint: `POST /auth/google`

### **Web Client ID (dùng chung)**
```
772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com
```

### **Google Cloud Console**
- [Create Credentials](https://console.cloud.google.com/apis/credentials)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

---

## 💡 10. TIPS & BEST PRACTICES

### **1. Error Handling**
```dart
try {
  final userData = await signInWithGoogle();
  // Handle success
} catch (error) {
  // Show user-friendly error message
  if (error.toString().contains('SIGN_IN_CANCELLED')) {
    showMessage('Sign in was cancelled');
  } else if (error.toString().contains('Network')) {
    showMessage('Please check your internet connection');
  } else {
    showMessage('Sign in failed. Please try again');
  }
}
```

### **2. Loading States**
```dart
bool isLoading = false;

void handleSignIn() async {
  setState(() => isLoading = true);
  
  try {
    await signInWithGoogle();
  } finally {
    setState(() => isLoading = false);
  }
}
```

### **3. Token Refresh**
```typescript
// Implement token refresh logic if backend supports it
const refreshToken = async () => {
  try {
    const response = await axios.post('/auth/refresh', {
      refreshToken: await getStoredRefreshToken(),
    });
    
    await saveToken(response.data.token);
    return response.data.token;
  } catch (error) {
    // Redirect to login if refresh fails
    navigateToLogin();
  }
};
```

### **4. Logout**
```dart
// Flutter
Future<void> logout() async {
  await _googleSignIn.signOut();
  await storage.delete(key: 'jwtToken');
  // Clear all app data
  // Navigate to login screen
}

// React Native
const logout = async () => {
  await GoogleSignin.signOut();
  await AsyncStorage.removeItem('jwtToken');
  // Clear all app data
  // Navigate to login screen
};
```

---

## 📞 11. SUPPORT & TROUBLESHOOTING

### **Nếu gặp vấn đề:**

1. **Check logs** trong console/terminal
2. **Verify Client IDs** trong Google Cloud Console
3. **Test API endpoint** với Postman/curl:
   ```bash
   curl -X POST https://uniclub-qyn9a.ondigitalocean.app/auth/google \
     -H "Content-Type: application/json" \
     -d '{"token":"<GOOGLE_ID_TOKEN>"}'
   ```
4. **Compare với web implementation** (code tham khảo trong tài liệu này)

### **Common Issues:**

| Issue | Check |
|-------|-------|
| Google Sign-In không mở | Client ID và SHA-1 (Android) |
| Backend trả về 401 | Google token có valid không? |
| Backend trả về 400 | Request body format đúng chưa? |
| Token không lưu | Storage permissions (iOS/Android) |

---

##    KẾT LUẬN

Tài liệu này cung cấp **toàn bộ thông tin** cần thiết để triển khai Google OAuth Login cho mobile app tương tự như web app hiện tại:

1.    **Client ID**: Cần tạo mới cho Android/iOS, dùng chung Web Client ID với backend
2.    **API Endpoint**: `POST /auth/google` với body `{ "token": "<google_id_token>" }`
3.    **Code Implementation**: Full code cho Flutter và React Native
4.    **Security**: Best practices về token storage và authorization
5.    **Testing**: Debug checklist và common errors

**Bước tiếp theo:**
1. Tạo Client IDs cho Android/iOS trong Google Cloud Console
2. Copy code implementation vào mobile project
3. Update configuration (Client IDs, API URL)
4. Test end-to-end flow
5. Deploy 🚀

---

**Last Updated:** November 13, 2025  
**Version:** 1.0  
**Author:** Anh Tri - UniClub Development Team
