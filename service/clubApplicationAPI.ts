import axiosInstance from "@/lib/axiosInstance"

export interface ClubApplication {
  applicationId: number
  clubId?: number | null
  clubName: string
  description: string
  majorId?: number
  majorName?: string
  vision?: string
  proposerReason?: string
  proposer?: {
    fullName: string
    email: string
  }
  submittedBy?: {
    fullName: string
    email: string
  }
  reviewedBy?: {
    fullName: string
    email: string
  } | null
  status: string
  rejectReason?: string | null
  submittedAt: string
  reviewedAt?: string | null
}
export interface ProcessApplicationBody {
  approve: boolean;
  rejectReason?: string;
}
export interface CreateClubAccountBody {
  applicationId: number;
  clubId: number;
  leaderFullName: string;
  leaderEmail: string;
  viceFullName: string;
  viceEmail: string;
  defaultPassword: string;
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
 * Fetches a single club application by ID from the backend.
 * @param id - Application ID
 * @returns Single ClubApplication object
 */
export async function getClubApplyById(id: number): Promise<ClubApplication> {
  try {
    const resp = await axiosInstance.get(`/api/club-applications/${id}`)
    const result = resp.data as { success: boolean; message: string; data: ClubApplication }
    
    if (!result.success || !result.data) {
      throw new Error(result.message || "Failed to fetch club application")
    }
    
    return result.data
  } catch (error: any) {
    console.error(`Error fetching club application ${id}:`, error)
    throw error
  }
}

export async function postClubApplication(
  body: {
    clubName: string
    description: string
    majorId: number
    vision: string
    proposerReason: string
  },
  otp: string
) {
  const response = await axiosInstance.post(
    "/api/club-applications",
    body,
    { 
      headers: { "Content-Type": "application/json" },
      params: { otp } // Add OTP as query parameter
    }
  )

  // Backend trả về: { success, message, data }
  const result = response.data as {
    success: boolean
    message: string
    data: ClubApplication
  }

  return result.data //    Chỉ trả ra phần data thật
}

export async function putClubApplicationStatus(applicationId: number, approve: boolean, rejectReason: string) {
  const response = await axiosInstance.put<ClubApplication>(
    `/api/club-applications/${applicationId}/decide`,
    { approve, rejectReason },
    { headers: { 'Content-Type': 'application/json' } }
  )
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
    // Response structure: { success, message, data }
    if (response.data?.success && response.data?.data) {
      return response.data.data
    }

    // Fallback to direct data if no wrapper
    return Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error("Error fetching my club applications:", error.response?.data || error.message)
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
  return result.data
}

/**
 *    NEW: Tạo tài khoản cho CLB từ một đơn đã được duyệt (POST /api/club-applications/create-club-accounts)
 * @param body Dữ liệu tài khoản Leader, Vice-Leader và mật khẩu
 * @returns Trả về một chuỗi string thông báo từ backend
 */
export async function createClubAccount(
  body: CreateClubAccountBody
): Promise<string> {
  const response = await axiosInstance.post(
    `/api/club-applications/create-club-accounts`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );

  // API trả về: { success, message, data: "string" }
  const result = response.data as {
    success: boolean;
    message: string;
    data: string;
  };

  if (!result.success) {
    throw new Error(result.message || "Failed to create club account");
  }
  return result.data;
}

/**
 *    NEW: Gửi mã OTP cho sinh viên xin lập CLB (POST /api/club-applications/send-otp)
 * @param studentEmail Email của sinh viên
 * @returns Trả về một chuỗi string thông báo từ backend
 */
export async function sendOtp(studentEmail: string): Promise<string> {
  const response = await axiosInstance.post(
    `/api/club-applications/send-otp`,
    null, // No body needed
    { 
      headers: { "Content-Type": "application/json" },
      params: { studentEmail } // Send as query parameter
    }
  );

  // API trả về: { success, message, data: "string" }
  const result = response.data as {
    success: boolean;
    message: string;
    data: string;
  };

  if (!result.success) {
    throw new Error(result.message || "Failed to send OTP");
  }
  return result.data;
}




export default {
  getClubApplications,
  getClubApplyById,
  postClubApplication,
  putClubApplicationStatus,
  getMyClubApply,
  processClubApplication,
  createClubAccount,
  sendOtp
}
