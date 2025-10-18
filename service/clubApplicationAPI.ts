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
  category: number
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

export default { 
  getClubApplications, 
  postClubApplication, 
  putClubApplicationStatus 
}
