import axiosInstance from "@/lib/axiosInstance"

// Event attendance statistics response
export interface EventAttendStats {
  eventId: number
  eventName: string
  totalRegistered: number
  checkinCount: number
  midCount: number
  checkoutCount: number
  noneCount: number
  halfCount: number
  fullCount: number
  suspiciousCount: number
  participationRate: number
  midComplianceRate: number
  fraudRate: number
}

export interface EventAttendStatsResponse {
  success: boolean
  message: string
  data: EventAttendStats
}

/**
 * Get attendance statistics for a specific event
 * @param eventId - The ID of the event
 * @returns Promise with event attendance statistics
 */
export async function getEventAttendStats(eventId: number): Promise<EventAttendStatsResponse> {
  try {
    const response = await axiosInstance.get<EventAttendStatsResponse>(
      `/api/attendance/stats/${eventId}`
    )
    return response.data
  } catch (error: any) {
    console.error("Error fetching event attendance stats:", error)
    throw error
  }
}

// Event attendance fraud record
export interface EventAttendFraud {
  registrationId: number
  memberName: string
  memberEmail: string
  checkinAt: string | null
  checkMidAt: string | null
  checkoutAt: string | null
  fraudReason: string
}

export interface EventAttendFraudResponse {
  success: boolean
  message: string
  data: EventAttendFraud[]
}

/**
 * Get fraud records for a specific event
 * @param eventId - The ID of the event
 * @returns Promise with event fraud records
 */
export async function getEventAttendFraud(eventId: number): Promise<EventAttendFraudResponse> {
  try {
    const response = await axiosInstance.get<EventAttendFraudResponse>(
      `/api/attendance/fraud/${eventId}`
    )
    return response.data
  } catch (error: any) {
    console.error("Error fetching event attendance fraud:", error)
    throw error
  }
}
