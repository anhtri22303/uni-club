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

