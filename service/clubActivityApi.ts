import axiosInstance from "@/lib/axiosInstance";

/**
 * Định nghĩa mức độ hoạt động
 */
export type ActivityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/**
 * Interface cho dữ liệu hoạt động của một thành viên trong tháng
 * Dựa trên schema response từ GET /api/clubs/{clubId}/activities/monthly
 * và GET /api/clubs/memberships/{membershipId}/activity
 */
export interface MemberActivityData {
  success: boolean;
  message: string;
  data: {
    membershipId: number;
    clubId: number;
    clubName: string;
    month: string; // Có thể là chuỗi "YYYY-MM"
    userId: number;
    studentCode: string;
    fullName: string;
    email: string;
    memberLevel: string;
    activityLevel: string; // ActivityLevel
    activityMultiplier: number;
    totalEvents: number;
    attendedEvents: number;
    eventParticipationRate: number;
    totalSessions: number;
    attendedSessions: number;
    sessionRate: number;
    staffScore: number;
    penaltyPoints: number;
    rawScore: number;
  };
}

/**
 * Interface cho dữ liệu tổng hợp hoạt động của tất cả members trong CLB
 * Dựa trên schema response từ GET /api/clubs/{clubId}/activities/monthly
 */
export interface ClubActivitiesMonthlyResponse {
  success: boolean;
  message: string;
  data: {
    clubId: number;
    clubName: string;
    month: string; // Có thể là chuỗi "YYYY-MM"
    members: {
      membershipId: number;
      userId: number;
      studentCode: string;
      fullName: string;
      email: string;
      memberLevel: string;
      activityLevel: string; // ActivityLevel
      activityMultiplier: number;
      totalEvents: number;
      attendedEvents: number;
      eventParticipationRate: number;
      totalSessions: number;
      attendedSessions: number;
      sessionRate: number;
      staffScore: number;
      penaltyPoints: number;
      rawScore: number;
    }[];
  };
}

/**
 * Interface cho dữ liệu hoạt động event của CLB
 * Dựa trên schema response từ GET /api/clubs/{clubId}/event-activity/monthly
 */
export interface ClubEventActivityMonthly {
  clubId: number;
  year: number;
  month: number;
  totalEvents: number;
  completedEvents: number;
  rejectedEvents: number;
  activityLevel: ActivityLevel | string;
  multiplier: number;
  finalScore: number;
}

/**
 * Interface cho cấu trúc response chung (khi data là ClubEventActivityMonthly)
 */
export interface ClubEventActivityMonthlyResponse {
  success: boolean;
  message: string;
  data: ClubEventActivityMonthly;
}

/**
 * Interface cho cấu trúc response cho các API không trả về data hoặc trả về data rỗng {}
 * Dùng cho POST /api/clubs/{clubId}/activities/recalculate
 */
export interface StandardClubActivityApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null; // Có thể là {} hoặc null tùy theo API
}

/**
 * Interface cho các tham số (path và query) của các hàm GET hoạt động CLB
 */
export interface GetClubActivityParams {
  clubId: number;
  month: string; // Ví dụ: "2025-11"
}

/**
 * Interface cho các tham số (path và query) của hàm GET hoạt động thành viên
 */
export interface GetMemberActivityParams {
  membershipId: number;
  month: string; // Ví dụ: "2025-11"
}

// --- CÁC HÀM API ---

/**
 * Lấy hoạt động của TẤT CẢ member trong CLB theo tháng (cho CLUB_LEADER / VICE_LEADER)
 * GET /api/clubs/{clubId}/activities/monthly
 * @param clubId - ID của CLB (path)
 * @param month - Tháng (query, format YYYY-MM)
 */
export const getClubActivitiesMonthly = async ({
  clubId,
  month,
}: GetClubActivityParams): Promise<ClubActivitiesMonthlyResponse['data']> => {
  try {
    const response = await axiosInstance.get<ClubActivitiesMonthlyResponse>(
      `/api/clubs/${clubId}/activities/monthly`,
      {
        params: { month },
      }
    );


    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch club activities monthly");
  } catch (error) {
    console.error("Error fetching club activities monthly:", error);
    throw error;
  }
};

/**
 * Xem chi tiết hoạt động của 1 member trong tháng (Dùng cho CLUB_LEADER / VICE_LEADER)
 * GET /api/clubs/memberships/{membershipId}/activity
 * @param membershipId - ID của Membership (path)
 * @param month - Tháng (query, format YYYY-MM)
 */
export const getMemberActivityByMembershipId = async ({
  membershipId,
  month,
}: GetMemberActivityParams): Promise<MemberActivityData['data']> => {
  try {
    const response = await axiosInstance.get<MemberActivityData>(
      `/api/clubs/memberships/${membershipId}/activity`,
      {
        params: { month },
      }
    );


    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch member activity by membership ID");
  } catch (error) {
    console.error("Error fetching member activity by membership ID:", error);
    throw error;
  }
};

/**
 * Tính lại mức độ hoạt động của member trong CLB cho 1 tháng (cho Leader)
 * POST /api/clubs/{clubId}/activities/recalculate
 * @param clubId - ID của CLB (path)
 * @param month - Tháng (query, format YYYY-MM)
 */
export const recalculateClubActivities = async ({
  clubId,
  month,
}: GetClubActivityParams): Promise<void> => {
  try {
    // API này không cần request body
    const response = await axiosInstance.post<StandardClubActivityApiResponse>(
      `/api/clubs/${clubId}/activities/recalculate`,
      {}, // Gửi body rỗng
      {
        params: { month },
      }
    );


    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to recalculate club activities");
    }
  } catch (error) {
    console.error("Error recalculating club activities:", error);
    throw error;
  }
};

/**
 * UniStaff xem hoạt động event của CLB trong 1 tháng (cho UNIVERSITY_STAFF hoặc ADMIN)
 * GET /api/clubs/{clubId}/event-activity/monthly
 * @param clubId - ID của CLB (path)
 * @param month - Tháng (query, format YYYY-MM)
 */
export const getClubEventActivityMonthly = async ({
  clubId,
  month,
}: GetClubActivityParams): Promise<ClubEventActivityMonthly> => {
  try {
    const response = await axiosInstance.get<ClubEventActivityMonthlyResponse>(
      `/api/clubs/${clubId}/event-activity/monthly`,
      {
        params: { month },
      }
    );


    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch club event activity monthly");
  } catch (error) {
    console.error("Error fetching club event activity monthly:", error);
    throw error;
  }
};