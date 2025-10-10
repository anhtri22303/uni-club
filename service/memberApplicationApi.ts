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

// LẤY DANH SÁCH TẤT CẢ ĐƠN XIN GIA NHẬP
export const fetchAllMemberApplications = async () => {
  try {
    const response = await axiosInstance.get("/api/member-applications")
    console.log("✅ Fetch member applications:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ Error fetching member applications:", error.response?.data || error.message)
    throw error
  }
}

// DUYỆT ĐƠN XIN GIA NHẬP (APPROVE)
export const approveMemberApplication = async (applicationId: number | string) => {
  try {
    const response = await axiosInstance.put(`/api/member-applications/${applicationId}/approve`)
    console.log("✅ Approved membership application:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ Error approving application:", error.response?.data || error.message)
    throw error
  }
}

// TỪ CHỐI ĐƠN XIN GIA NHẬP (REJECT)
export const rejectMemberApplication = async (
  applicationId: number | string,
  reason: string
) => {
  try {
    const response = await axiosInstance.put(`/api/member-applications/${applicationId}/reject`, {
      reason,
    })
    console.log("✅ Rejected membership application:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ Error rejecting application:", error.response?.data || error.message)
    throw error
  }
}

// XOÁ ĐƠN XIN GIA NHẬP (nếu cần)
export const deleteMemberApplication = async (applicationId: number | string) => {
  try {
    const response = await axiosInstance.delete(`/api/member-applications/${applicationId}`)
    console.log("✅ Deleted membership application:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ Error deleting application:", error.response?.data || error.message)
    throw error
  }
}
