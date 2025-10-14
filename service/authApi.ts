import axiosInstance from "../lib/axiosInstance"

// Expected response shape from backend on successful login
export interface LoginResponse {
  token: string
  userId: number | string
  email: string
  fullName: string
  role: string
  staff: boolean
  clubIds?: number[]
}

export interface LoginCredentials {
  email: string
  password: string
}

// POST /auth/login -> returns token + user info
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const res = await axiosInstance.post<LoginResponse>("/auth/login", credentials)
  console.log("Login response:", res.data)
  return res.data
}

// Keep other helpers (OAuth) as-is for the future
export const loginWithGoogle = async (): Promise<void> => {
  try {
    // build absolute redirect url from axiosInstance baseURL so it stays consistent
    const base = axiosInstance.defaults.baseURL || ""
    const redirect = new URL("oauth2/authorization/google", base).toString()
    window.location.href = redirect
  } catch (error) {
    console.error("Error during Google login:", error)
    throw error
  }
}

export const handleGoogleCallback = async (code: string) => {
  try {
    const response = await axiosInstance.get(`/auth/oauth2/callback?code=${code}`)
    console.log("Google callback success", response.data)
    return response.data
  } catch (error) {
    console.error("Error during Google callback:", error)
    throw error
  }
}

export const loginWithGoogleToken = async (credentials: { token: string }): Promise<LoginResponse> => {
  try {
    console.log("🚀 Sending Google token to backend:", {
      url: `${axiosInstance.defaults.baseURL}/auth/google`,
      tokenLength: credentials.token?.length || 0,
      tokenStart: credentials.token?.substring(0, 20) + "..."
    })
    
    const response = await axiosInstance.post<LoginResponse>("/auth/google", credentials)
    console.log("✅ Google token login success:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ Error during Google token login:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
    
    // ⚠️ MOCK RESPONSE - CHỈ DÙNG KHI BACKEND CHƯA READY
    if (error.response?.status === 401) {
      console.warn("🔄 Backend chưa có Google OAuth, sử dụng mock response...")
      
      // Parse Google token để lấy thông tin user (unsafe - chỉ để demo)
      try {
        const payload = JSON.parse(atob(credentials.token.split('.')[1]))
        const mockResponse: LoginResponse = {
          token: "mock-jwt-token-" + Date.now(),
          userId: Date.now(),
          email: payload.email || "user@fpt.edu.vn",
          fullName: payload.name || "Google User",
          role: "student",
          staff: false
        }
        
        console.log("🎭 Using mock Google login response:", mockResponse)
        return mockResponse
      } catch (parseError) {
        console.error("Failed to parse Google token for mock response")
        throw new Error("Backend chưa hỗ trợ Google login và không thể tạo mock response")
      }
    }
    
    throw error
  }
}

// function to call sign up API

export interface SignUpCredentials {
  email: string
  password: string
  fullName: string
  phone: string
  roleName: string
  studentCode: string 
  majorName: string 
}

export interface SignUpResponse {
  token: string
  userId: number
  email: string
  fullName: string
  role: string
}

export const signUp = async (credentials: SignUpCredentials): Promise<SignUpResponse> => {
  try {
    const res = await axiosInstance.post<SignUpResponse>(
      "/auth/register",
      {
        email: credentials.email,
        password: credentials.password,
        fullName: credentials.fullName,
        phone: credentials.phone,
        roleName: credentials.roleName, // Swagger yêu cầu roleName
        studentCode: credentials.studentCode, // Thêm studentCode vào payload
        majorName: credentials.majorName || "Undeclared", // Thêm majorName vào payload, mặc định là "Undeclared"
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    return res.data
  } catch (error: any) {
    if (error.response) {
      console.error("Error response:", error.response.data)
    } else {
      console.error("Error during sign up:", error.message)
    }
    throw error
  }
}

