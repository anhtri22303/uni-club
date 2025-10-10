import axiosInstance from "@/lib/axiosInstance"

// The backend accepts minimal payload: { clubId, reason }
export const postMemAppli = async (payload: { clubId: number | string; reason: string }) => {
  try {
    const response = await axiosInstance.post("/api/member-applications", payload)
    console.log("Posted membership application:", response.data)
    return response.data
  } catch (error: any) {
    console.error("Error posting membership application:", error)
    // rethrow the axios error so caller can inspect response.data for validation errors
    throw error
  }
}

// Fetch all member applications (GET /api/member-applications)
export const getMemberApplications = async () => {
  try {
    const response = await axiosInstance.get("/api/member-applications")
    console.log("Member apply:", response.data)
    // Expecting an array of application objects
    return response.data
  } catch (error: any) {
    console.error("Error fetching member applications:", error)
    throw error
  }
}

