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
  // const res = await axiosInstance.post<LoginResponse>("/auth/login", credentials)
  // console.log("Login response:", res.data)
  // return res.data
  try {
    const res = await axiosInstance.post<LoginResponse>("/auth/login", credentials)
    console.log("Login response:", res.data)
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
    console.log("Sign up response:", res.data)
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
    console.log("Forgot password response:", res.data)
    
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
    console.log("Reset password response:", res.data)
    
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

// Force Reset Password API (for admin/system forced password resets)
export interface ForceResetPasswordRequest {
  userId: number | string
  newPassword: string
}

export interface ForceResetPasswordResponse {
  success: boolean
  message: string
  data: null
}

export const forceResetPassword = async (
  userId: number | string,
  newPassword: string
): Promise<ForceResetPasswordResponse> => {
  try {
    const res = await axiosInstance.put(
      `/api/users/${userId}/force-reset-password`,
      null,
      {
        params: {
          newPassword
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    console.log("Force reset password response:", res.data)
    
    // Handle both wrapped and direct response formats
    if (res.data && typeof res.data === 'object') {
      // If response is wrapped in standard format { success, message, data }
      if ('success' in res.data && 'message' in res.data) {
        return res.data as ForceResetPasswordResponse
      }
      // If response is direct message string or other format
      return {
        success: true,
        message: (res.data as any).message || "Password has been successfully reset.",
        data: null
      }
    }
    
    // Fallback for unexpected response format
    return {
      success: true,
      message: "Password has been successfully reset.",
      data: null
    }
  } catch (error: any) {
    console.error("Force reset password error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Re-throw with formatted error
    if (error.response?.data) {
      throw error
    }
    
    throw new Error("Failed to force reset password")
  }
}

