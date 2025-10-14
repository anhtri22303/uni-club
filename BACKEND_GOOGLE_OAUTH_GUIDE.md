# 🚀 Backend Google OAuth Implementation Guide

## 📋 **Vấn đề hiện tại**
- Frontend Google OAuth đã hoạt động ✅
- Backend chưa có endpoint `/auth/google` ❌  
- Hiện tại đang dùng mock response tạm thời

## 🔧 **Backend cần implement**

### 1. **Dependencies cần thêm (Java Spring Boot)**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

### 2. **Google Token Verifier Configuration**

```java
@Configuration
public class GoogleConfig {
    
    @Value("${google.client.id}")
    private String googleClientId;
    
    @Bean
    public GoogleIdTokenVerifier googleTokenVerifier() {
        return new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(),
            new GsonFactory()
        )
        .setAudience(Arrays.asList(googleClientId))
        .build();
    }
}
```

### 3. **Request/Response DTOs**

```java
// GoogleTokenRequest.java
public class GoogleTokenRequest {
    private String token;
    
    // getters and setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}

// AuthResponse.java (có thể đã có)
public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullName;
    private String role;
    private boolean staff;
    
    // constructors, getters and setters
}
```

### 4. **Controller Endpoint**

```java
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody GoogleTokenRequest request) {
        try {
            AuthResponse response = authService.authenticateWithGoogle(request.getToken());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid Google token"));
        }
    }
}
```

### 5. **Service Implementation**

```java
@Service
public class AuthService {
    
    @Autowired
    private GoogleIdTokenVerifier googleTokenVerifier;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public AuthResponse authenticateWithGoogle(String idToken) throws Exception {
        // Verify Google ID Token
        GoogleIdToken token = googleTokenVerifier.verify(idToken);
        if (token == null) {
            throw new IllegalArgumentException("Invalid Google ID token");
        }
        
        GoogleIdToken.Payload payload = token.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        
        // Find or create user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> createGoogleUser(email, name, picture));
        
        // Generate JWT
        String jwt = jwtUtil.generateToken(user.getEmail());
        
        return new AuthResponse(
            jwt,
            user.getId(), 
            user.getEmail(),
            user.getFullName(),
            user.getRole().getRoleName(),
            user.isStaff()
        );
    }
    
    private User createGoogleUser(String email, String name, String picture) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(name);
        user.setAvatarUrl(picture);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString())); // Random password
        
        // Set default role
        Role studentRole = roleRepository.findByRoleName("STUDENT")
            .orElseThrow(() -> new RuntimeException("Default role not found"));
        user.setRole(studentRole);
        
        return userRepository.save(user);
    }
}
```

### 6. **Application Properties**

```properties
# application.properties
google.client.id=787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com
```

## 🧪 **Test Backend khi implement xong**

```bash
curl -X POST http://localhost:8080/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "real_google_id_token_here"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "userId": 123,
    "email": "user@fpt.edu.vn", 
    "fullName": "User Name",
    "role": "student",
    "staff": false
  }
}
```

## ⚠️ **Tắt Mock Response**

Khi backend đã ready, trong `authApi.ts` comment đoạn mock:

```typescript
// Comment out mock response block
// if (error.response?.status === 401) {
//   console.warn("🔄 Backend chưa có Google OAuth, sử dụng mock response...")
//   ...
// }
```

## 🔒 **Security Notes**

1. **Validate Google Client ID** trong token audience
2. **Check token expiration** 
3. **Rate limiting** cho Google OAuth endpoint
4. **Log security events** (login attempts, etc.)
5. **Handle edge cases** (email already exists, invalid tokens, etc.)

---

💡 **Frontend hiện tại đã hoạt động hoàn hảo. Chỉ cần backend implement các đoạn code trên!**