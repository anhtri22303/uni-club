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
  const resp = await axiosInstance.get<ClubApplication[]>("/api/club-applications")
  return resp.data
}

/**
 * Create a new club application by calling POST /api/club-applications.
 * The backend in the project seems to accept clubName and description as query or body.
 * We'll send a JSON body { clubName, description } and return the created resource.
 */
export async function postClubApplication(body: { clubName: string; description: string }) {
  // The backend expects parameters as query params (see Swagger UI). Send an
  // empty body and provide params so the request becomes:
  // POST /api/club-applications?clubName=...&description=...
  const resp = await axiosInstance.post<ClubApplication>(
    "/api/club-applications",
    null,
    {
      params: {
        clubName: body.clubName,
        description: body.description,
      },
    },
  )
  return resp.data
}

/**
 * Update application status. Endpoint: PUT /api/club-applications/{id}/status?status=...
 */
export async function putClubApplicationStatus(applicationId: number, status: string) {
  const resp = await axiosInstance.put<ClubApplication>(
    `/api/club-applications/${applicationId}/status`,
    null,
    { params: { status } },
  )
  return resp.data
}

export default { getClubApplications, postClubApplication }
