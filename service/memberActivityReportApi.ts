import axiosInstance from "@/lib/axiosInstance";

/**
 * Định nghĩa mức độ hoạt động
 */
export type ActivityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/**
 * Định nghĩa mức độ đánh giá Staff
 */
export type StaffEvaluation = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT" | "UNKNOWN";

// ==========================================
// 1. DEFINITION CÁC INTERFACE DỮ LIỆU
// ==========================================

/**
 * Interface 1: Dữ liệu điểm hoạt động ĐẦY ĐỦ
 * Dùng cho:
 * - /api/clubs/{clubId}/members/activity-live (Live)
 * - /api/clubs/{clubId}/members/me/activity (Của tôi)
 * - /api/admin/member-activities (Admin)
 * - memberOfMonth trong Summary
 */
export interface MemberActivityFullScore {
    membershipId: number;
    userId: number;
    fullName: string;
    studentCode: string;
    clubId: number;
    clubName: string;
    year: number;
    month: number;

    // Event Info
    totalEventRegistered: number;
    totalEventAttended: number;
    eventAttendanceRate: number;
    totalPenaltyPoints: number;

    // Attendance Score Info
    activityLevel: ActivityLevel | string;
    attendanceBaseScore: number;
    attendanceMultiplier: number;
    attendanceTotalScore: number;

    // Staff Score Info
    staffBaseScore: number;
    totalStaffCount: number;
    staffEvaluation: StaffEvaluation | string;
    staffMultiplier: number;
    staffScore: number;
    staffTotalScore: number;

    // Club Session Info
    totalClubSessions: number;
    totalClubPresent: number;
    sessionAttendanceRate: number;

    // Final
    finalScore: number;
}

/**
 * Interface 2: Dữ liệu điểm hoạt động TÓM TẮT (Lịch sử)
 * Dùng cho: /api/clubs/{clubId}/members/activity
 * Cập nhật: Khớp chính xác với JSON response (chỉ có counts, không có rates/scores)
 */
export interface MemberActivityShortItem {
    membershipId: number;
    userId: number;
    fullName: string;
    studentCode: string;
    clubId: number;
    clubName: string;
    year: number;
    month: number;
    // Event Stats
    totalEventRegistered: number;
    totalEventAttended: number;
    totalPenaltyPoints: number;
    // Staff Stats
    totalStaffCount: number;
    // Session Stats
    totalClubSessions: number;
    totalClubPresent: number;
    // Final Result
    finalScore: number;
}

/**
 * Interface 3: Tổng quan hoạt động CLB
 * Dùng cho: /api/clubs/{clubId}/activity/summary
 */
export interface ClubActivitySummary {
    clubId: number;
    clubName: string;
    year: number;
    month: number;
    totalEventsCompleted: number;
    memberCount: number;
    fullMembersCount: number;
    memberOfMonth: MemberActivityFullScore; // Sử dụng bản Full
    clubMultiplier: number;
}

/**
 * Interface 4: Kết quả tính toán điểm (Preview)
 * Dùng cho: POST calculate-score
 */
export interface ScoreCalculationResult {
    attendanceBaseScore: number;
    attendanceMultiplier: number;
    attendanceTotalScore: number;
    staffBaseScore: number;
    staffMultiplier: number;
    staffTotalScore: number;
    finalScore: number;
}

export interface AutoGenerateParams {
    clubId: number;
    year: number;
    month: number;
}

// Interface riêng cho response này vì data trả về là string
export interface AutoGenerateResponse {
    success: boolean;
    message: string;
    data: string;
}

// ==========================================
// 2. DEFINITION CÁC API RESPONSE
// ==========================================

// Response trả về MẢNG FULL (Live, Admin)
export interface MemberActivityFullListResponse {
    success: boolean;
    message: string;
    data: MemberActivityFullScore[];
}

// Response trả về 1 OBJECT FULL (Me)
export interface MemberActivityFullSingleResponse {
    success: boolean;
    message: string;
    data: MemberActivityFullScore;
}

// Response trả về MẢNG SHORT (History)
export interface MemberActivityShortListResponse {
    success: boolean;
    message: string;
    data: MemberActivityShortItem[];
}

// Response trả về Summary
export interface ClubActivitySummaryApiResponse {
    success: boolean;
    message: string;
    data: ClubActivitySummary;
}

// Response tính toán điểm
export interface MemberCalculationApiResponse {
    success: boolean;
    message: string;
    data: ScoreCalculationResult;
}

// Standard Response
export interface StandardApiResponse {
    success: boolean;
    message: string;
    data: Record<string, never> | null;
}

// ==========================================
// 3. PARAMETERS & BODY TYPES
// ==========================================

export interface GetClubMemberActivityParams {
    clubId: number;
    year: number;
    month: number;
}

export interface GetLiveActivityParams {
    clubId: number;
    attendanceBase?: number; // Optional vì có default value = 100
    staffBase?: number;      // Optional vì có default value = 100
}

export interface GetAdminAllMemberActivitiesParams {
    year: number;
    month: number;
}

// Body để create/update giống bản Full Score (vì khi lưu là lưu full)
export type CreateMonthlyActivityBody = Omit<MemberActivityFullScore, 'clubId' | 'clubName' | 'fullName' | 'studentCode' | 'userId'>;

export interface MonthlyActivityItem extends CreateMonthlyActivityBody {
    // Kế thừa các trường số liệu
}

export interface UpdateBulkMonthlyActivityBody {
    year: number;
    month: number;
    items: MonthlyActivityItem[];
}

export interface UpdateBulkMonthlyActivityParams {
    clubId: number;
    body: UpdateBulkMonthlyActivityBody;
}

export interface BaseScoreCalculationBody {
    attendanceBaseScore: number;
    staffBaseScore: number;
}

export interface CalculateMemberScoreParams {
    clubId: number;
    membershipId: number;
    body: BaseScoreCalculationBody;
}

// ==========================================
// 4. API FUNCTIONS
// ==========================================

/**
 * 1. GET: Leader xem danh sách lịch sử (Bản Tóm Tắt)
 * /api/clubs/{clubId}/members/activity
 * Trả về: MemberActivityShortItem[]
 */
export const getClubMemberActivity = async ({
    clubId,
    year,
    month,
}: GetClubMemberActivityParams): Promise<MemberActivityShortItem[]> => {
    try {
        const response = await axiosInstance.get<MemberActivityShortListResponse>(
            `/api/clubs/${clubId}/members/activity`,
            { params: { year, month } }
        );

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching club member activity (short):", error);
        throw error;
    }
};

/**
 * 2. GET: Leader xem điểm LIVE real-time (Bản Đầy Đủ)
 * /api/clubs/{clubId}/members/activity-live
 * Trả về: MemberActivityFullScore[]
 */
export const getClubMemberActivityLive = async ({
    clubId,
    attendanceBase,
    staffBase,
}: GetLiveActivityParams): Promise<MemberActivityFullScore[]> => {
    try {
        const response = await axiosInstance.get<MemberActivityFullListResponse>(
            `/api/clubs/${clubId}/members/activity-live`,
            {
                params: {
                    attendanceBase,
                    staffBase
                },
            }
        );

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching club member live activity:", error);
        throw error;
    }
};

/**
 * 3. GET: Member xem điểm của bản thân (Bản Đầy Đủ - 1 Object)
 * /api/clubs/{clubId}/members/me/activity
 */
export const getMyMemberActivity = async ({
    clubId,
    year,
    month,
}: GetClubMemberActivityParams): Promise<MemberActivityFullScore> => {
    try {
        const response = await axiosInstance.get<MemberActivityFullSingleResponse>(
            `/api/clubs/${clubId}/members/me/activity`,
            { params: { year, month } }
        );

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
 * 4. GET: Admin xem toàn hệ thống (Bản Đầy Đủ - Mảng)
 * /api/admin/member-activities
 */
export const getAdminAllMemberActivities = async ({
    year,
    month,
}: GetAdminAllMemberActivitiesParams): Promise<MemberActivityFullScore[]> => {
    try {
        const response = await axiosInstance.get<MemberActivityFullListResponse>(
            `/api/admin/member-activities`,
            { params: { year, month } }
        );

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching admin all member activities:", error);
        throw error;
    }
};

/**
 * 5. GET: Leader xem tổng quan (Bao gồm MemberOfMonth Full)
 * /api/clubs/{clubId}/activity/summary
 */
export const getClubActivitySummary = async ({
    clubId,
    year,
    month,
}: GetClubMemberActivityParams): Promise<ClubActivitySummary> => {
    try {
        const response = await axiosInstance.get<ClubActivitySummaryApiResponse>(
            `/api/clubs/${clubId}/activity/summary`,
            { params: { year, month } }
        );

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
 * 6. POST: Tính điểm Preview cho 1 member
 * /api/clubs/{clubId}/members/{membershipId}/calculate-score
 */
export const calculateScoreForMember = async ({
    clubId,
    membershipId,
    body,
}: CalculateMemberScoreParams): Promise<ScoreCalculationResult> => {
    try {
        const response = await axiosInstance.post<MemberCalculationApiResponse>(
            `/api/clubs/${clubId}/members/${membershipId}/calculate-score`,
            body
        );

        if (response.data && response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data?.message || "Failed to calculate score");
    } catch (error) {
        console.error(`Error calculating score for member ${membershipId}:`, error);
        throw error;
    }
};

/**
 * 7. PUT: Cập nhật Bulk Activity
 * /api/clubs/{clubId}/activity/monthly/update-bulk
 */
export const updateBulkMonthlyActivity = async ({
    clubId,
    body
}: UpdateBulkMonthlyActivityParams): Promise<void> => {
    try {
        const response = await axiosInstance.put<StandardApiResponse>(
            `/api/clubs/${clubId}/activity/monthly/update-bulk`,
            body
        );

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.message || "Failed to bulk update activities");
        }
    } catch (error) {
        console.error("Error bulk updating activities:", error);
        throw error;
    }
};

/**
 * 8. POST: Tự động tạo báo cáo tháng cho toàn CLB
 * /api/clubs/{clubId}/activity/monthly/auto-generate?year=...&month=...
 */
export const autoGenerateMonthlyReport = async ({
    clubId,
    year,
    month
}: AutoGenerateParams): Promise<string> => {
    try {
        const response = await axiosInstance.post<AutoGenerateResponse>(
            `/api/clubs/${clubId}/activity/monthly/auto-generate`,
            null, // Body để null vì tham số nằm ở query
            {
                params: { year, month } // Axios sẽ tự chuyển thành ?year=...&month=...
            }
        );

        if (response.data && response.data.success) {
            return response.data.message;
        }
        throw new Error(response.data?.message || "Failed to generate monthly report");
    } catch (error) {
        console.error("Error auto generating report:", error);
        throw error;
    }
};