import axiosInstance from "@/lib/axiosInstance";

// ==========================================
// 1. DEFINITION CÁC INTERFACE DỮ LIỆU
// ==========================================

/**
 * Interface 1: Dữ liệu báo cáo hoạt động tháng của CLB (Full)
 * Dùng cho: /api/club-activity/{clubId}, /api/club-activity/ranking
 */
export interface ClubMonthlyActivity {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  
  // Chỉ số hoạt động
  totalEvents: number;
  avgFeedback: number;
  avgCheckinRate: number;
  avgMemberActivityScore: number;
  staffPerformanceScore: number;
  
  // Kết quả chấm điểm
  awardScore: number;
  awardLevel: string;
  finalScore: number;
  rewardPoints: number;
  
  // Trạng thái khóa
  locked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

/**
 * Interface 2: Dữ liệu Breakdown (Phân tích chi tiết)
 */
export interface ClubActivityBreakdown {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEvents: number;
  avgFeedback: number;
  avgCheckinRate: number;
  avgMemberActivityScore: number;
  staffPerformanceScore: number;
  finalScore: number;
  rewardPoints: number;
  awardScore: number;
  awardLevel: string;
}

/**
 * Interface 3: Dữ liệu Trending (Tăng trưởng)
 */
export interface ClubTrendingItem {
  clubId: number;
  clubName: string;
  currentScore: number;
  previousScore: number;
  scoreDiff: number;
  percentGrowth: number;
}

/**
 * Interface 4: Kết quả so sánh 2 CLB
 */
export interface ClubComparisonResult {
  clubA: ClubActivityBreakdown;
  clubB: ClubActivityBreakdown;
}

/**
 * Interface 5: Lịch sử điểm (Line chart)
 */
export interface ClubActivityHistoryItem {
  month: number;
  score: number;
}

/**
 * Interface 6: Đóng góp của Event
 */
export interface ClubEventContribution {
  eventId: number;
  eventName: string;
  feedback: number;
  checkinRate: number;
  weight: number;
}

/**
 * Interface 7: Kết quả Approve
 */
export interface ApproveResult extends ClubMonthlyActivity {
  walletBalance?: number;
}

// ==========================================
// 2. DEFINITION CÁC API RESPONSE
// ==========================================

export interface ClubActivitySingleResponse {
  success: boolean;
  message: string;
  data: ClubMonthlyActivity;
}

export interface ClubActivityListResponse {
  success: boolean;
  message: string;
  data: ClubMonthlyActivity[];
}

export interface ClubTrendingListResponse {
  success: boolean;
  message: string;
  data: ClubTrendingItem[];
}

export interface ClubBreakdownResponse {
  success: boolean;
  message: string;
  data: ClubActivityBreakdown;
}

export interface ClubComparisonResponse {
  success: boolean;
  message: string;
  data: ClubComparisonResult;
}

export interface ClubHistoryResponse {
  success: boolean;
  message: string;
  data: ClubActivityHistoryItem[];
}

export interface ClubEventContributionResponse {
  success: boolean;
  message: string;
  data: ClubEventContribution[];
}

export interface ClubApproveResponse {
  success: boolean;
  message: string;
  data: ApproveResult;
}

export interface CheckExistsResponse {
  success: boolean;
  message: string;
  data: boolean;
}

export interface StandardApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null;
}

// ==========================================
// 3. PARAMETERS
// ==========================================

export interface BasePeriodParams {
  year: number;
  month: number;
}

export interface ClubPeriodParams extends BasePeriodParams {
  clubId: number;
}

export interface CompareParams extends BasePeriodParams {
  clubA: number;
  clubB: number;
}

// ==========================================
// 4. API FUNCTIONS
// ==========================================

/**
 * 1. GET: Xem chi tiết báo cáo hoạt động của 1 CLB
 * /api/club-activity/{clubId}
 */
export const getClubActivityReport = async ({
  clubId,
  year,
  month,
}: ClubPeriodParams): Promise<ClubMonthlyActivity> => {
  try {
    const response = await axiosInstance.get<ClubActivitySingleResponse>(
      `/api/club-activity/${clubId}`,
      { params: { year, month } }
    );
    if (response.data && response.data.success) return response.data.data;
    throw new Error(response.data?.message || "Failed to fetch report");
  } catch (error) {
    console.error(`Error fetching report for club ${clubId}:`, error);
    throw error;
  }
};

/**
 * 2. GET: Phân tích chi tiết điểm (Breakdown)
 * /api/club-activity/{clubId}/breakdown
 */
export const getClubActivityBreakdown = async ({
  clubId,
  year,
  month,
}: ClubPeriodParams): Promise<ClubActivityBreakdown> => {
  try {
    const response = await axiosInstance.get<ClubBreakdownResponse>(
      `/api/club-activity/${clubId}/breakdown`,
      { params: { year, month } }
    );
    if (response.data && response.data.success) return response.data.data;
    throw new Error(response.data?.message || "Failed to fetch breakdown");
  } catch (error) {
    console.error(`Error fetching breakdown for club ${clubId}:`, error);
    throw error;
  }
};

/**
 * 3. GET: CLB tăng trưởng mạnh nhất tháng (Trending)
 * /api/club-activity/trending
 */
export const getTrendingClubs = async ({
  year,
  month,
}: BasePeriodParams): Promise<ClubTrendingItem[]> => {
  try {
    const response = await axiosInstance.get<ClubTrendingListResponse>(
      `/api/club-activity/trending`,
      { params: { year, month } }
    );
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching trending clubs:", error);
    throw error;
  }
};

/**
 * 4. GET: Bảng xếp hạng các CLB (Ranking)
 * /api/club-activity/ranking
 */
export const getClubRanking = async ({
  year,
  month,
}: BasePeriodParams): Promise<ClubMonthlyActivity[]> => {
  try {
    const response = await axiosInstance.get<ClubActivityListResponse>(
      `/api/club-activity/ranking`,
      { params: { year, month } }
    );
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching club ranking:", error);
    throw error;
  }
};

/**
 * 5. GET: So sánh 2 CLB
 * /api/club-activity/compare
 */
export const compareClubs = async ({
  clubA,
  clubB,
  year,
  month,
}: CompareParams): Promise<ClubComparisonResult> => {
  try {
    const response = await axiosInstance.get<ClubComparisonResponse>(
      `/api/club-activity/compare`,
      { params: { clubA, clubB, year, month } }
    );
    if (response.data && response.data.success) return response.data.data;
    throw new Error(response.data?.message || "Failed to compare clubs");
  } catch (error) {
    console.error("Error comparing clubs:", error);
    throw error;
  }
};

/**
 * 6. GET: Lịch sử điểm CLB
 * /api/club-activity/{clubId}/history
 */
export const getClubActivityHistory = async ({
  clubId,
  year,
}: { clubId: number; year: number }): Promise<ClubActivityHistoryItem[]> => {
  try {
    const response = await axiosInstance.get<ClubHistoryResponse>(
      `/api/club-activity/${clubId}/history`,
      { params: { year } }
    );
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback cho trường hợp trả về mảng trực tiếp
    if (Array.isArray(response.data)) return response.data as any;
    return [];
  } catch (error) {
    console.error(`Error fetching history for club ${clubId}:`, error);
    throw error;
  }
};

/**
 * 7. GET: Kiểm tra CLB đã có record tháng chưa
 * /api/club-activity/{clubId}/exists
 */
export const checkClubActivityExists = async ({
  clubId,
  year,
  month,
}: ClubPeriodParams): Promise<boolean> => {
  try {
    const response = await axiosInstance.get<CheckExistsResponse | boolean>(
      `/api/club-activity/${clubId}/exists`,
      { params: { year, month } }
    );
    if (typeof response.data === 'object' && 'success' in response.data) {
        return (response.data as CheckExistsResponse).success && !!(response.data as CheckExistsResponse).data;
    }
    if (typeof response.data === 'boolean') return response.data;
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * 8. GET: Xem đóng góp Event
 * /api/club-activity/{clubId}/events
 */
export const getClubEventContributions = async ({
  clubId,
  year,
  month,
}: ClubPeriodParams): Promise<ClubEventContribution[]> => {
  try {
    const response = await axiosInstance.get<ClubEventContributionResponse>(
      `/api/club-activity/${clubId}/events`,
      { params: { year, month } }
    );
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching event contributions for club ${clubId}:`, error);
    throw error;
  }
};

// ==========================================
// CÁC HÀM ACTION (ADMIN/STAFF)
// ==========================================

/**
 * 9. POST: Tính lại điểm cho 1 CLB
 */
export const recalculateClubActivity = async ({ clubId, year, month }: ClubPeriodParams): Promise<ClubMonthlyActivity> => {
  const response = await axiosInstance.post<ClubActivitySingleResponse>(
    `/api/club-activity/${clubId}/recalculate`, null, { params: { year, month } }
  );
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || "Failed to recalculate");
};

/**
 * 10. POST: Khóa dữ liệu tháng
 */
export const lockClubActivity = async ({ clubId, year, month }: ClubPeriodParams): Promise<ClubMonthlyActivity> => {
  const response = await axiosInstance.post<ClubActivitySingleResponse>(
    `/api/club-activity/${clubId}/lock`, null, { params: { year, month } }
  );
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || "Failed to lock");
};

/**
 * 11. POST: Duyệt cấp điểm thưởng
 */
export const approveClubActivity = async ({ clubId, year, month }: ClubPeriodParams): Promise<ApproveResult> => {
  const response = await axiosInstance.post<ClubApproveResponse>(
    `/api/club-activity/${clubId}/approve`, null, { params: { year, month } }
  );
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || "Failed to approve");
};

/**
 * 12. POST: Tính lại điểm toàn bộ CLB (Batch)
 */
export const recalculateAllClubs = async ({ year, month }: BasePeriodParams): Promise<ClubMonthlyActivity[]> => {
  const response = await axiosInstance.post<ClubActivityListResponse>(
    `/api/club-activity/recalculate-all`, null, { params: { year, month } }
  );
  if (response.data?.success && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

/**
 * 13. DELETE: [ADMIN] Xóa record tháng của CLB
 * Dùng khi cần reset dữ liệu để tính lại từ đầu
 */
export const deleteClubActivity = async ({
  clubId,
  year,
  month,
}: ClubPeriodParams): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/club-activity/${clubId}`,
      { params: { year, month } }
    );
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to delete activity record");
    }
  } catch (error) {
    console.error(`Error deleting record for club ${clubId}:`, error);
    throw error;
  }
};