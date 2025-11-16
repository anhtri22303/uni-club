import axiosInstance from "@/lib/axiosInstance";

/**
 * Định nghĩa mức độ hoạt động
 */
export type ActivityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/**
 * Interface cho dữ liệu điểm hoạt động của một thành viên
 * Dựa trên schema response từ /api/clubs/{clubId}/members/activity
 * và /api/admin/member-activities
 * và /api/clubs/{clubId}/members/me/activity
 */
export interface MemberActivityScore {
  membershipId: number;
  userId: number;
  fullName: string;
  studentCode: string;
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEventRegistered: number;
  totalEventAttended: number;
  eventAttendanceRate: number;
  totalClubSessions: number;
  totalClubPresent: number;
  sessionAttendanceRate: number;
  avgStaffPerformance: number;
  totalPenaltyPoints: number;
  baseScore: number;
  baseScorePercent: number;
  activityLevel: ActivityLevel | string;
  appliedMultiplier: number;
  finalScore: number;
}

/**
 * Interface cho cấu trúc response chung (khi data là một MẢNG)
 */
export interface MemberActivityApiResponse {
  success: boolean;
  message: string;
  data: MemberActivityScore[];
}

/**
 * Interface cho cấu trúc response (khi data là MỘT OBJECT MemberActivityScore)
 * Dùng cho /api/clubs/{clubId}/members/me/activity
 */
export interface MemberActivityDataApiResponse {
  success: boolean;
  message: string;
  data: MemberActivityScore; // Lưu ý: Đây là 1 object, không phải mảng
}

/**
 * Interface cho dữ liệu tổng quan hoạt động CLB
 * Dùng cho /api/clubs/{clubId}/activity/summary
 */
export interface ClubActivitySummary {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEventsCompleted: number;
  fullMembersCount: number;
  memberOfMonth: MemberActivityScore; // Lồng object MemberActivityScore
  clubMultiplier: number;
}

/**
 * Interface cho cấu trúc response (khi data là ClubActivitySummary)
 * Dùng cho /api/clubs/{clubId}/activity/summary
 */
export interface ClubActivitySummaryApiResponse {
  success: boolean;
  message: string;
  data: ClubActivitySummary;
}

/**
 * Interface cho các tham số (path và query) của các hàm
 */
export interface GetClubMemberActivityParams {
  clubId: number;
  year: number;
  month: number;
}

/**
 * Interface cho tham số (query) của hàm admin
 */
export interface GetAdminAllMemberActivitiesParams {
  year: number;
  month: number;
}

// --- CÁC HÀM API ---

/**
 * Lấy danh sách điểm hoạt động của tất cả member trong CLB (cho Leader)
 * GET /api/clubs/{clubId}/members/activity
 * @param clubId - ID của CLB (path)
 * @param year - Năm (query)
 * @param month - Tháng (query)
 */
export const getClubMemberActivity = async ({
  clubId,
  year,
  month,
}: GetClubMemberActivityParams): Promise<MemberActivityScore[]> => {
  try {
    const response = await axiosInstance.get<MemberActivityApiResponse>(
      `/api/clubs/${clubId}/members/activity`,
      {
        params: { year, month },
      }
    );

    console.log("Fetched club member activity response:", response.data);

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching club member activity:", error);
    throw error;
  }
};

/**
 * Lấy danh sách điểm hoạt động của TẤT CẢ member (cho Admin/UniStaff)
 * GET /api/admin/member-activities
 * @param year - Năm (query)
 * @param month - Tháng (query)
 */
export const getAdminAllMemberActivities = async ({
  year,
  month,
}: GetAdminAllMemberActivitiesParams): Promise<MemberActivityScore[]> => {
  try {
    const response = await axiosInstance.get<MemberActivityApiResponse>(
      `/api/admin/member-activities`,
      {
        params: { year, month },
      }
    );

    console.log("Fetched admin all member activities response:", response.data);

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }

    return [];
  } catch (error) {
    console.error("Error fetching admin all member activities:", error);
    throw error;
  }
};

/**
 * Lấy tổng quan hoạt động của CLB (cho Leader/Vice-Leader)
 * GET /api/clubs/{clubId}/activity/summary
 * @param clubId - ID của CLB (path)
 * @param year - Năm (query)
 * @param month - Tháng (query)
 */
export const getClubActivitySummary = async ({
  clubId,
  year,
  month,
}: GetClubMemberActivityParams): Promise<ClubActivitySummary> => {
  try {
    const response = await axiosInstance.get<ClubActivitySummaryApiResponse>(
      `/api/clubs/${clubId}/activity/summary`,
      {
        params: { year, month },
      }
    );

    console.log("Fetched club activity summary response:", response.data);

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch club summary");
  } catch (error) {
    console.error("Error fetching club activity summary:", error);
    throw error;
  }
};

/**
 * Lấy điểm hoạt động chi tiết của bản thân (member) trong CLB
 * GET /api/clubs/{clubId}/members/me/activity
 * @param clubId - ID của CLB (path)
 * @param year - Năm (query)
 * @param month - Tháng (query)
 */
export const getMyMemberActivity = async ({
  clubId,
  year,
  month,
}: GetClubMemberActivityParams): Promise<MemberActivityScore> => {
  try {
    const response = await axiosInstance.get<MemberActivityDataApiResponse>(
      `/api/clubs/${clubId}/members/me/activity`,
      {
        params: { year, month },
      }
    );

    console.log("Fetched my member activity response:", response.data);

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch my activity");
  } catch (error) {
    console.error("Error fetching my member activity:", error);
    throw error;
  }
};