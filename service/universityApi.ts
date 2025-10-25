import axiosInstance from "@/lib/axiosInstance"

// Interface for club ranking
interface ClubRanking {
  rank: number
  clubId: number
  clubName: string
  totalPoints: number
}

// Interface for university points response
interface UniversityPointsResponse {
  totalUniversityPoints: number
  clubRankings: ClubRanking[]
}

// Interface for monthly attendance summary
interface MonthlySummary {
  month: string
  participantCount: number
}

// Interface for attendance summary response
interface AttendanceSummaryResponse {
  year: number
  monthlySummary: MonthlySummary[]
  clubId: number | null
  eventId: number | null
}

// Interface for club attendance ranking
interface ClubAttendanceRanking {
  rank: number
  clubId: number
  clubName: string
  attendanceCount: number
}

// Interface for attendance ranking response
interface AttendanceRankingResponse {
  totalAttendances: number
  clubRankings: ClubAttendanceRanking[]
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * Fetch university points and club rankings
 * GET /api/university/points
 */
export const fetchUniversityPoints = async (): Promise<UniversityPointsResponse> => {
  try {
    const response = await axiosInstance.get("/api/university/points")
    console.log("Fetched university points response:", response.data)
    
    // If backend wraps the response with { success, message, data }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data as UniversityPointsResponse
    }
    
    // If the endpoint returns the data directly
    return response.data as UniversityPointsResponse
  } catch (error) {
    console.error("Error fetching university points:", error)
    throw error
  }
}

/**
 * Fetch university attendance summary
 * GET /api/university/attendance-summary
 */
export const fetchAttendanceSummary = async (year: number): Promise<AttendanceSummaryResponse> => {
  try {
    const response = await axiosInstance.get("/api/university/attendance-summary", {
      params: { year }
    })
    console.log("Fetched attendance summary response:", response.data)
    
    // If backend wraps the response with { success, message, data }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data as AttendanceSummaryResponse
    }
    
    // If the endpoint returns the data directly
    return response.data as AttendanceSummaryResponse
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    throw error
  }
}

/**
 * Fetch university attendance ranking (top clubs by attendance)
 * GET /api/university/attendance-ranking
 */
export const fetchAttendanceRanking = async (): Promise<AttendanceRankingResponse> => {
  try {
    const response = await axiosInstance.get("/api/university/attendance-ranking")
    console.log("Fetched attendance ranking response:", response.data)
    
    // If backend wraps the response with { success, message, data }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data as AttendanceRankingResponse
    }
    
    // If the endpoint returns the data directly
    return response.data as AttendanceRankingResponse
  } catch (error) {
    console.error("Error fetching attendance ranking:", error)
    throw error
  }
}

