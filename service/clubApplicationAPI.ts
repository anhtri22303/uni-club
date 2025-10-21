import axiosInstance from "@/lib/axiosInstance"

export interface ClubApplication {
  applicationId: number
  clubName: string
  description: string
  submittedBy: {
    fullName: string
    email: string
  }
  reviewedBy?: any
  status: string
  submittedAt: string
  reviewedAt?: string | null
}
export interface ProcessApplicationBody {
  approve: boolean;
  rejectReason?: string;
  internalNote?: string;
  viceLeaderEmail?: string;
  viceLeaderFullName?: string;
  viceLeaderStudentCode?: string;
}
/**
 * Fetches club applications from the backend.
 * Returns the raw API shape defined by ClubApplication.
 */
export async function getClubApplications(): Promise<ClubApplication[]> {
  const resp = await axiosInstance.get("/api/club-applications/all")
  // The backend returns { success, message, data: [...] }
  const result = resp.data as { success: boolean; message: string; data: ClubApplication[] }
  return result.data
}

export async function postClubApplication(body: {
  clubName: string
  description: string
  majorId: number
  proposerReason: string
}) {
  const response = await axiosInstance.post(
    "/api/club-applications",
    body,
    { headers: { "Content-Type": "application/json" } }
  )

  // Backend trả về: { success, message, data }
  const result = response.data as {
    success: boolean
    message: string
    data: ClubApplication
  }

  return result.data // ✅ Chỉ trả ra phần data thật
}

export async function putClubApplicationStatus(applicationId: number, approve: boolean, rejectReason: string) {
  const response = await axiosInstance.put<ClubApplication>(
    `/api/club-applications/${applicationId}/decide`,
    { approve, rejectReason },
    { headers: { 'Content-Type': 'application/json' } }
  )
  console.log("ClubApplication response:", response.data)
  return response.data
}

/**
 * LẤY DANH SÁCH ĐƠN XIN TẠO CLB CỦA MÌNH (GET /api/club-applications/my)
 */
export async function getMyClubApply(): Promise<ClubApplication[]> {
  try {
    const response = await axiosInstance.get<{
      success: boolean
      message: string
      data: ClubApplication[]
    }>("/api/club-applications/my")
    console.log("✅ My club applications:", response.data)
    
    // Response structure: { success, message, data }
    if (response.data?.success && response.data?.data) {
      return response.data.data
    }
    
    // Fallback to direct data if no wrapper
    return Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error("❌ Error fetching my club applications:", error.response?.data || error.message)
    throw error
  }
}
export async function processClubApplication(
  applicationId: number,
  body: ProcessApplicationBody
): Promise<ClubApplication> {
  const response = await axiosInstance.put(
    `/api/club-applications/${applicationId}/approve`,
    body,
    { headers: { "Content-Type": "application/json" } }
  )

  // API trả về cấu trúc { success, message, data }
  const result = response.data as {
    success: boolean
    message: string
    data: ClubApplication
  }

  if (!result.success) {
    throw new Error(result.message || "Failed to process application")
  }

  console.log("✅ Application processed successfully:", result.data)
  return result.data
}
export default { 
  getClubApplications, 
  postClubApplication, 
  putClubApplicationStatus,
  getMyClubApply,
  processClubApplication
}
