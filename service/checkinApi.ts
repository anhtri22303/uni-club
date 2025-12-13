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
  data?: {
    token: string
    qrUrl: string
  }
}

/**
 * GET /api/attendance/qr-token/{eventId}
 * Generate a check-in token for an event
 * Returns: { token: string, qrUrl: string }
 */
export const generateCode = async (eventId: number): Promise<{ token: string; qrUrl: string }> => {
  try {
    const response = await axiosInstance.get(
      `/api/attendance/qr-token/${eventId}`
    )
    
    // Backend returns { token: string, qrUrl: string }
    const data = response.data as { token: string; qrUrl: string }
    
    if (data && data.token && data.qrUrl) {
      return {
        token: data.token,
        qrUrl: data.qrUrl
      }
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
    const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.response?.data || error?.message || 'Check-in failed'
    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Check-in failed')
  }
}

export default {
  generateCode,
  checkin
}
