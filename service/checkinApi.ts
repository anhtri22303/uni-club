import axiosInstance from "@/lib/axiosInstance"

export interface CheckinRequest {
  token: string
}

export interface CheckinResponse {
  success: boolean
  message: string
  data?: {
    attendanceId: number
    userId: number
    eventId: number
    checkInTime: string
    points: number
  }
}

export interface GenerateCodeResponse {
  success: boolean
  message: string
  data?: string // The generated token
}

/**
 * POST /api/attendance/generate/{eventId}?ttlSeconds=300
 * Generate a check-in token for an event
 */
export const generateCode = async (eventId: number, ttlSeconds: number = 300): Promise<string> => {
  try {
    const response = await axiosInstance.post(
      `/api/attendance/generate/${eventId}`,
      null,
      {
        params: { ttlSeconds }
      }
    )
    console.log("Generate code response:", response.data)
    
    // Backend returns token as plain string
    const token = response.data as string
    
    if (token && typeof token === 'string') {
      return token
    }
    
    throw new Error("Failed to generate code - invalid response")
  } catch (error: any) {
    console.error("Error generating code:", error)
    throw error
  }
}

/**
 * POST /api/attendance/checkin
 * Check in to an event using a token
 * Backend returns a simple string like "Checked-in"
 */
export const checkin = async (token: string): Promise<string> => {
  try {
    const response = await axiosInstance.post("/api/attendance/checkin", null, {
      params: { token }
    })
    console.log("Checkin response:", response.data)
    
    // Handle both string and object responses
    if (typeof response.data === 'string') {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      // If it's an object, extract the message or data field
      const dataObj = response.data as any
      return dataObj.message || dataObj.data || 'Checked-in successfully'
    }
    
    return 'Checked-in successfully'
  } catch (error: any) {
    console.error("Error during checkin:", error)
    
    // Extract error message properly
    const errorMsg = error?.response?.data?.message || error?.response?.data || error?.message || 'Check-in failed'
    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Check-in failed')
  }
}

export default {
  generateCode,
  checkin
}
