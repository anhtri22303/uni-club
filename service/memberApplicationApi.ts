import axiosInstance from "@/lib/axiosInstance"

// The backend accepts minimal payload: { clubId, reason }
export const postMemAppli = async (payload: { clubId: number | string; message: string }) => {
  try {
    const response = await axiosInstance.post("/api/member-applications", {
      clubId: Number(payload.clubId),
      message: payload.message,
    })

    console.log("✅ Posted member application:", response.data)
    return response.data as {
      applicationId: number
      clubId: number
      clubName: string
      applicantId: number
      applicantName: string
      applicantEmail: string
      status: string
      message: string
      reason: string
      handledById: number
      handledByName: string
      createdAt: string
      updatedAt: string
      studentCode: string
    }
  } catch (error: any) {
    console.error("Error posting member application:", error.response?.data || error.message)
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

// LẤY DANH SÁCH ĐƠN XIN GIA NHẬP CỦA MÌNH (GET /api/member-applications/my)
export const getMyMemApply = async () => {
  try {
    const response = await axiosInstance.get<{
      success: boolean
      message: string
      data: any[]
    }>("/api/member-applications/my")
    console.log("✅ My member applications:", response.data)
    
    // Response structure: { success, message, data }
    if (response.data?.success && response.data?.data) {
      return response.data.data
    }
    
    // Fallback to direct data if no wrapper
    return response.data
  } catch (error: any) {
    console.error("❌ Error fetching my member applications:", error.response?.data || error.message)
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
    const response = await axiosInstance.put(`/api/member-applications/${applicationId}/status`, {
      status: "APPROVED",
      reason: "Approved by club leader",
    })
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
    const response = await axiosInstance.put(`/api/member-applications/${applicationId}/status`, {
      status: "REJECTED",
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

// LẤY DANH SÁCH ĐƠN XIN GIA NHẬP THEO CLUB ID
export const getMemberApplyByClubId = async (clubId: string | number) => {
  try {
    const response = await axiosInstance.get(`/api/member-applications/club/${clubId}`)
    const resData: any = response.data
    console.log(`✅ Fetched member applications for club ${clubId}:`, resData)
    
    // If response is direct array of applications
    if (Array.isArray(resData)) return resData
    
    // If response has wrapper structure like { success, data, message }
    if (resData?.data && Array.isArray(resData.data)) return resData.data
    
    // If response has content property (pagination)
    if (resData?.content && Array.isArray(resData.content)) return resData.content
    
    // Fallback to empty array if no applications found
    return []
  } catch (error: any) {
    console.error(`❌ Error fetching member applications for club ${clubId}:`, error.response?.data || error.message)
    throw error
  }
}


