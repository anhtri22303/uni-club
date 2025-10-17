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

/**
 * Create a new club application by calling POST /api/club-applications.
 * The backend in the project seems to accept clubName and description as query or body.
 * We'll send a JSON body { clubName, description } and return the created resource.
 */
export async function postClubApplication(body: { clubName: string; description: string; category: string; proposerReason: string }) {
  // The backend expects a JSON body with clubName, description, category, proposerReason
  const resp = await axiosInstance.post<ClubApplication>(
    "/api/club-applications",
    {
      clubName: body.clubName,
      description: body.description,
      category: body.category,
      proposerReason: body.proposerReason,
    },
    { headers: { 'Content-Type': 'application/json' } }
  )
  return resp.data
}

/**
 * Decide application status. Endpoint: PUT /api/club-applications/{id}/decide
 * Body: { approve: boolean, rejectReason: string }
 */
export async function putClubApplicationStatus(applicationId: number, approve: boolean, rejectReason: string) {
  const resp = await axiosInstance.put<ClubApplication>(
    `/api/club-applications/${applicationId}/decide`,
    { approve, rejectReason },
    { headers: { 'Content-Type': 'application/json' } }
  )
  console.log("ClubApplication response:", resp.data)
  return resp.data
}

export default { getClubApplications, postClubApplication, putClubApplicationStatus }
