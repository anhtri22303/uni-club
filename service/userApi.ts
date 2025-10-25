import axiosInstance from "@/lib/axiosInstance"

// Type for the new API wrapper structure
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type PaginatedResponse<T> = {
  content: T[]
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
}

export const fetchUser = async () => {
  try {
    console.log("🚀 fetchUser: Starting API call to api/users")
    const response = await axiosInstance.get("api/users")
    const body = response.data as ApiResponse<PaginatedResponse<any>> | PaginatedResponse<any> | any[]
    console.log("✅ fetchUser: Received response:", body)
    console.log("✅ fetchUser: Response status:", response.status)

    // ✅ NEW API STRUCTURE: { success, message, data: { content: [...] } }
    if (body && typeof body === "object" && "success" in body && body.success && "data" in body && body.data && Array.isArray(body.data.content)) {
      console.log("✅ fetchUser: Returning body.data.content (array of", body.data.content.length, "users)")
      return body.data.content
    }

    // LEGACY: If backend returns a paginated wrapper directly, return the `content` array.
    if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
      console.log("⚠️ fetchUser: Using legacy format - returning body.content")
      return body.content
    }

    // If the API already returns an array of users, return it directly.
    if (Array.isArray(body)) {
      console.log("⚠️ fetchUser: Returning direct array")
      return body
    }

    console.warn("⚠️ fetchUser: Unknown response format, returning empty array")
    // Fallback: return empty array to simplify caller logic
    return []
  } catch (error) {
    console.error("❌ fetchUser: Error fetching users:", error)
    throw error
  }
}

// New: fetchProfile - returns the current authenticated user's profile (unwrapped `data`)
export const fetchProfile = async () => {
  try {
    const response = await axiosInstance.get("api/users/profile")
    const body = response.data
    console.log("Fetched profile response:", body)

    // If backend uses { success, message, data }
    if (body && typeof body === "object" && "data" in body && "success" in body && (body as any).success) {
      const profileData = (body as any).data
      
      // Transform the response to match expected format
      return {
        userId: profileData?.userId,
        email: profileData?.email,
        fullName: profileData?.fullName,
        phone: profileData?.phone,
        status: profileData?.status,
        avatarUrl: profileData?.avatarUrl,
        studentCode: profileData?.studentCode,
        majorName: profileData?.majorName,
        bio: profileData?.bio,
        role: profileData?.role,
        wallet: profileData?.wallet,
        memberships: profileData?.memberships || []
      }
    }

    // If the endpoint returns the profile object directly
    if (body && typeof body === "object") {
      return body
    }

    return null
  } catch (error) {
    console.error("Error fetching profile:", error)
    throw error
  }
}

export const fetchUserById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`api/users/${id}`)
    // expected: response.data is user object
    // If the backend wraps payload in { success, message, data }, unwrap it.
    const body = response.data
    // Always log the raw response body for easier debugging
    console.log("fetchUserById:", body)
    if (body && typeof body === "object" && "data" in body) {
      console.log("fetchUserById unwrapped data:", body.data)
      return body.data
    }
    console.log("fetchUserById returned raw body:", body)
    return body
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error)
    throw error
  }
}

export const updateUserById = async (id: string | number, data: Record<string, any>) => {
  try {
    const response = await axiosInstance.put(`api/users/${id}`, data)
    // expected: response.data has { success, message, data }
    return response.data as any
  } catch (error) {
    console.error(`Error updating user ${id}:`, error)
    throw error
  }
}

// New: editProfile - update current authenticated user's profile
export const editProfile = async (data: {
  majorName?: string
  phone?: string
  bio?: string
  avatarUrl?: string
  fullName?: string
  email?: string
}) => {
  try {
    console.log("Editing profile with data:", data)
    const response = await axiosInstance.put(`api/users/profile`, data)
    const body = response.data
    console.log("Edit profile response:", body)
    
    // Return the full response for consistent handling
    return body as any
  } catch (error) {
    console.error("Error editing profile:", error)
    throw error
  }
}

// New: uploadAvatar - upload avatar file directly to backend
export const uploadAvatar = async (file: File) => {
  try {
    console.log("Uploading avatar file:", file.name)
    
    const formData = new FormData()
    formData.append('file', file)
    
    // Gọi API upload avatar với multipart/form-data
    const response = await axiosInstance.post(`api/users/profile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
    
    const body = response.data
    console.log("Upload avatar response:", body)
    
    return body as any
  } catch (error) {
    console.error("Error uploading avatar:", error)
    throw error
  }
}

export const deleteUserById = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`api/users/${id}`)
    // expected: response.data may contain { success, message, deleted }
    return response.data as any
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error)
    throw error
  }
}

// New: getUserStats - get user statistics
export const getUserStats = async () => {
  try {
    const response = await axiosInstance.get("api/users/stats")
    const body = response.data
    console.log("Fetched user stats response:", body)
    
    // If backend uses { success, message, data }
    if (body && typeof body === "object" && "data" in body && "success" in body && (body as any).success) {
      return (body as any).data
    }
    
    // If the endpoint returns the stats object directly
    if (body && typeof body === "object") {
      return body
    }
    
    return null
  } catch (error) {
    console.error("Error fetching user stats:", error)
    throw error
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