import axiosInstance from "../lib/axiosInstance"

// Expected response shape from backend on successful login
export interface LoginResponse {
  token: string
  userId: number | string
  email: string
  fullName: string
  role: string
  staff?: boolean
  clubIds?: number[]  // For STUDENT role
  clubId?: number     // For CLUB_LEADER role
  requirePasswordChange?: boolean  // For CLUB_LEADER role
}

export interface LoginCredentials {
  email: string
  password: string
}

// POST /auth/login -> returns token + user info
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // const res = await axiosInstance.post<LoginResponse>("/auth/login", credentials)
  // console.log("Login response:", res.data)
  // return res.data
  try {
    const res = await axiosInstance.post<LoginResponse>("/auth/login", credentials)
    return res.data
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message)
    throw error
  }

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
    return response.data
  } catch (error) {
    console.error("Error during Google callback:", error)
    throw error
  }
}

// Google OAuth Response from backend (wrapped in success/data format)
export interface GoogleAuthResponse {
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
    clubIds?: number[]  // For STUDENT role
    clubId?: number     // For CLUB_LEADER role
    requirePasswordChange?: boolean  // For CLUB_LEADER role
  }
}

export const loginWithGoogleToken = async (credentials: { token: string }): Promise<LoginResponse> => {
  const requestTimestamp = new Date().toISOString()
  const requestId = `google_login_${Date.now()}`
  
  // Prepare request details
  const requestUrl = `${axiosInstance.defaults.baseURL}/auth/google`
  const requestDetails = {
    id: requestId,
    timestamp: requestTimestamp,
    method: "POST",
    url: requestUrl,
    endpoint: "/auth/google",
    headers: {
      "Content-Type": "application/json",
      ...(typeof window !== "undefined" && sessionStorage.getItem("jwtToken") 
        ? { Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.substring(0, 20)}...` }
        : {}
      )
    },
    body: {
      token: credentials.token,
      tokenLength: credentials.token?.length || 0,
      tokenPreview: credentials.token?.substring(0, 30) + "..."
    }
  }

  // Log request details
  console.log("🚀 [Google Login API] Request Details:", requestDetails)

  try {
    const response = await axiosInstance.post<GoogleAuthResponse>("/auth/google", credentials)
    
    // Prepare response details
    const responseDetails = {
      id: requestId,
      timestamp: new Date().toISOString(),
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: {
        success: response.data.success,
        message: response.data.message,
        hasToken: !!response.data.data?.token,
        email: response.data.data?.email,
        fullName: response.data.data?.fullName,
        role: response.data.data?.role,
        userId: response.data.data?.userId,
        staff: response.data.data?.staff,
        clubIds: response.data.data?.clubIds,
        clubId: response.data.data?.clubId,
        requirePasswordChange: response.data.data?.requirePasswordChange
      }
    }

    // Log response details
    console.log("✅ [Google Login API] Response Details:", responseDetails)

    // Check if response is successful
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Google authentication failed")
    }

    // Transform Google OAuth response to LoginResponse format
    const userData = response.data.data
    const result: LoginResponse = {
      token: userData.token,
      userId: userData.userId || 0, // Backend might not return userId immediately
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role || "student", // Default to student if not provided
    }
    
    // Add optional fields based on role
    if (userData.staff !== undefined) result.staff = userData.staff
    if (userData.clubId !== undefined) result.clubId = userData.clubId
    if (userData.clubIds !== undefined) result.clubIds = userData.clubIds
    if (userData.requirePasswordChange !== undefined) result.requirePasswordChange = userData.requirePasswordChange
    
    // Log the response structure for debugging
    console.log("📊 [Google Login] Response structure:", {
      role: result.role,
      hasClubId: result.clubId !== undefined,
      hasClubIds: result.clubIds !== undefined,
      hasRequirePasswordChange: result.requirePasswordChange !== undefined,
      clubId: result.clubId,
      clubIds: result.clubIds,
      requirePasswordChange: result.requirePasswordChange
    })
    
    return result
  } catch (error: any) {
    // Prepare error details
    const errorDetails = {
      id: requestId,
      timestamp: new Date().toISOString(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      stack: error.stack
    }

    // Log error details
    console.error("❌ [Google Login API] Error Details:", errorDetails)

    // Re-throw with more specific error message
    if (error.response?.status === 401) {
      throw new Error("Invalid Google token or authentication failed")
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || "Missing or invalid Google token")
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
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

// Forgot Password API
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  data: null
}

export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const res = await axiosInstance.post(
      "/auth/forgot-password",
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    // Handle both wrapped and direct response formats
    if (res.data && typeof res.data === 'object') {
      // If response is wrapped in standard format { success, message, data }
      if ('success' in res.data && 'message' in res.data) {
        return res.data as ForgotPasswordResponse
      }
      // If response is direct message string or other format
      return {
        success: true,
        message: (res.data as any).message || "Password reset email sent successfully",
        data: null
      }
    }
    
    // Fallback for unexpected response format
    return {
      success: true,
      message: "Password reset email sent successfully",
      data: null
    }
  } catch (error: any) {
    console.error("Forgot password error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Re-throw with formatted error
    if (error.response?.data) {
      throw error
    }
    
    throw new Error("Failed to send password reset email")
  }
}

// Reset Password API
export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
  data: null
}

export const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  try {
    const res = await axiosInstance.post(
      "/auth/reset-password",
      {
        email,
        token,
        newPassword
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    // Handle both wrapped and direct response formats
    if (res.data && typeof res.data === 'object') {
      // If response is wrapped in standard format { success, message, data }
      if ('success' in res.data && 'message' in res.data) {
        return res.data as ResetPasswordResponse
      }
      // If response is direct message string or other format
      return {
        success: true,
        message: (res.data as any).message || "Your password has been successfully reset.",
        data: null
      }
    }
    
    // Fallback for unexpected response format
    return {
      success: true,
      message: "Your password has been successfully reset.",
      data: null
    }
  } catch (error: any) {
    console.error("Reset password error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Re-throw with formatted error
    if (error.response?.data) {
      throw error
    }
    
    throw new Error("Failed to reset password")
  }
}

// Change Password API (for CLUB_LEADER when clicking banner)
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
  data: null
}

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> => {
  try {
    const res = await axiosInstance.post(
      "/auth/change-password",
      {
        oldPassword,
        newPassword
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    // Handle both wrapped and direct response formats
    if (res.data && typeof res.data === 'object') {
      // If response is wrapped in standard format { success, message, data }
      if ('success' in res.data && 'message' in res.data) {
        return res.data as ChangePasswordResponse
      }
      // If response is direct message string or other format
      return {
        success: true,
        message: (res.data as any).message || "Password changed successfully. Please re-login.",
        data: null
      }
    }
    
    // Fallback for unexpected response format
    return {
      success: true,
      message: "Password changed successfully. Please re-login.",
      data: null
    }
  } catch (error: any) {
    console.error("Change password error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Re-throw with formatted error
    if (error.response?.data) {
      throw error
    }
    
    throw new Error("Failed to change password")
  }
}
