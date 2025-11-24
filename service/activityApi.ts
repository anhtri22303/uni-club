import axiosInstance from "@/lib/axiosInstance";

/**
 * Định nghĩa mức độ hoạt động
 */
export type ActivityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/**
 * Định nghĩa mức độ đánh giá Staff
 */
export type StaffEvaluation = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT" | "UNKNOWN"; 

/**
 * Interface cho dữ liệu điểm hoạt động của một thành viên
 * Đã CẬP NHẬT theo schema Attendance/Staff mới nhất từ Swagger
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

    // Dữ liệu thô Attendance & Event
    totalClubSessions: number;
    totalClubPresent: number;
    sessionAttendanceRate: number;
    totalEventRegistered: number;
    totalEventAttended: number;
    eventAttendanceRate: number;
    totalPenaltyPoints: number;

    // Điểm và hệ số Attendance
    activityLevel: ActivityLevel | string;
    attendanceBaseScore: number;
    attendanceMultiplier: number;
    attendanceTotalScore: number; // Điểm Attendance thực tế (Base * Multiplier)

    // Điểm và hệ số Staff
    staffBaseScore: number;
    totalStaffCount: number;
    staffEvaluation: StaffEvaluation | string;
    staffMultiplier: number;
    staffScore: number; // Điểm của một đợt Staff
    staffTotalScore: number; // Tổng điểm Staff thực tế

    // Total Score
    finalScore: number; // attendanceTotalScore + staffTotalScore

    // Giữ lại cho khả năng tương thích với code cũ
    avgStaffPerformance?: number;
    baseScore?: number;
    baseScorePercent?: number;
    appliedMultiplier?: number;
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
 * Interface cho cấu trúc response cho các API không trả về data hoặc trả về data rỗng {}
 */
export interface StandardApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null; // Có thể là {} hoặc null tùy theo API
}

/**
 * Interface cho Response khi tính điểm thành công cho 1 member
 * POST /api/clubs/{clubId}/members/{membershipId}/calculate-score
 */
export interface MemberCalculationApiResponse {
    success: boolean;
    message: string;
    data: {
        attendanceBaseScore: number;
        attendanceMultiplier: number;
        attendanceTotalScore: number;
        staffBaseScore: number;
        staffMultiplier: number;
        staffTotalScore: number;
        finalScore: number;
    };
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
  memberCount: number; // Thêm lại theo schema summary mới
  fullMembersCount: number;
  memberOfMonth: MemberActivityScore; // Lồng object MemberActivityScore (Đã được cập nhật)
  clubMultiplier: number;
}

/**
 * Interface cho cấu trúc response (khi data là ClubActivitySummary)
 */
export interface ClubActivitySummaryApiResponse {
  success: boolean;
  message: string;
  data: ClubActivitySummary;
}

/**
 * Interface cho các tham số (path và query) của các hàm GET
 */
export interface GetClubMemberActivityParams {
  clubId: number;
  year: number;
  month: number;
}

/**
 * Interface cho tham số của hàm GET LIVE Score
 */
export interface GetLiveActivityParams {
    clubId: number;
    attendanceBase: number;
    staffBase: number;
}

/**
 * Interface cho tham số (query) của hàm admin
 */
export interface GetAdminAllMemberActivitiesParams {
  year: number;
  month: number;
}

/**
 * Interface cho Request body của API PUT/POST baseScore (Base Score Attendance/Staff)
 * Dùng cho POST /api/clubs/{clubId}/members/{membershipId}/calculate-score
 */
export interface BaseScoreCalculationBody {
    attendanceBaseScore: number;
    staffBaseScore: number; 
}

/**
 * Interface cho tham số của API tính điểm cho 1 member
 */
export interface CalculateMemberScoreParams {
    clubId: number;
    membershipId: number;
    body: BaseScoreCalculationBody;
}

/**
 * Interface cho Request body của API cập nhật baseScore (API CŨ)
 */
export interface UpdateBaseScoreBody {
    membershipId: number;
    baseScore: number; 
}

/**
 * Interface cho tham số của API cập nhật baseScore (API CŨ)
 */
export interface UpdateBaseScoreParams {
    clubId: number;
    year: number;
    month: number;
    body: UpdateBaseScoreBody;
}

// --- CÁC HÀM API ---

/**
 * Lấy danh sách điểm hoạt động của tất cả member trong CLB (cho Leader) - LỊCH SỬ
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
 * Lấy danh sách điểm hoạt động REAL-TIME của member
 * GET /api/clubs/{clubId}/members/activity-live
 * @param clubId - ID của CLB (path)
 * @param attendanceBase - Base Score Attendance (query)
 * @param staffBase - Base Score Staff (query)
 */
export const getClubMemberActivityLive = async ({
    clubId,
    attendanceBase,
    staffBase,
}: GetLiveActivityParams): Promise<MemberActivityScore[]> => {
    try {
        const response = await axiosInstance.get<MemberActivityApiResponse>(
            `/api/clubs/${clubId}/members/activity-live`,
            {
                params: { 
                    attendanceBase: attendanceBase, 
                    staffBase: staffBase 
                },
            }
        );

        console.log("Fetched club member live activity response:", response.data);

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        if (response.data && response.data.message) {
            throw new Error(response.data.message);
        }

        return [];
    } catch (error) {
        console.error("Error fetching club member live activity:", error);
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

/**
 * Tính toán điểm cho một member cụ thể sau khi cập nhật Base Score
 * POST /api/clubs/{clubId}/members/{membershipId}/calculate-score
 * @param clubId - ID của CLB (path)
 * @param membershipId - ID thành viên (path)
 * @param body - Base scores mới (attendanceBaseScore, staffBaseScore)
 */
export const calculateScoreForMember = async ({
    clubId,
    membershipId,
    body,
}: CalculateMemberScoreParams): Promise<MemberCalculationApiResponse['data']> => {
    try {
        const response = await axiosInstance.post<MemberCalculationApiResponse>(
            `/api/clubs/${clubId}/members/${membershipId}/calculate-score`,
            body
        );

        console.log("Calculated score for member response:", response.data);

        if (response.data && response.data.success && response.data.data) {
            return response.data.data;
        }

        throw new Error(response.data?.message || "Failed to calculate score for member");
    } catch (error) {
        console.error(`Error calculating score for member ${membershipId}:`, error);
        throw error;
    }
};

/**
 * Leader nhập điểm phát (baseScore) cho member (API CŨ)
 * PUT /api/clubs/{clubId}/members/activity/base-score
 */
export const updateMemberBaseScore = async ({
    clubId,
    year,
    month,
    body,
}: UpdateBaseScoreParams): Promise<void> => {
    try {
        const response = await axiosInstance.put<StandardApiResponse>(
            `/api/clubs/${clubId}/members/activity/base-score`,
            body,
            {
                params: { year, month },
            }
        );

        console.log("Updated member base score response:", response.data);

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.message || "Failed to update member base score (OLD API)");
        }
    } catch (error) {
        console.error("Error updating member base score (OLD API):", error);
        throw error;
    }
};

/**
 * Tính toán finalScore cho toàn bộ member trong tháng (API CŨ)
 * POST /api/clubs/{clubId}/members/activity/calculate
 */
export const calculateFinalScore = async ({
    clubId,
    year,
    month,
}: GetClubMemberActivityParams): Promise<void> => {
    try {
        const response = await axiosInstance.post<StandardApiResponse>(
            `/api/clubs/${clubId}/members/activity/calculate`,
            {},
            {
                params: { year, month },
            }
        );

        console.log("Calculated final score response (OLD API):", response.data);

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.message || "Failed to calculate final scores (OLD API)");
        }
    } catch (error) {
        console.error("Error calculating final score (OLD API):", error);
        throw error;
    }
};