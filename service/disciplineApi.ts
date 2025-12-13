import axiosInstance from "@/lib/axiosInstance";

// --- INTERFACE CHUNG TỪ UNISTAFF/ADMIN API ---

/**
 * Định nghĩa mức độ vi phạm (level)
 */
export type PenaltyLevel = "MINOR" | "MEDIUM" | "MAJOR" | "CRITICAL";

/**
 * Interface cho dữ liệu chi tiết của một Rule Vi Phạm
 * Dùng cho cả UniStaff (tạo/sửa) và Leader (xem)
 */
export interface PenaltyRule {
  id: number;
  name: string;
  description: string;
  level: PenaltyLevel | string;
  penaltyPoints: number;
}

/**
 * Interface cho Request Body khi tạo mới hoặc cập nhật Rule Vi Phạm (UniStaff Only)
 */
export interface PenaltyRuleBody {
  name: string;
  description: string;
  level: PenaltyLevel | string;
  penaltyPoints: number;
}

/**
 * Interface cho cấu trúc response chung (khi data là một MẢNG PenaltyRule)
 * Dùng cho GET /api/penalty-rules (UniStaff) và GET /api/clubs/{clubId}/discipline/penalty-rules (Leader)
 */
export interface PenaltyRulesApiResponse {
  success: boolean;
  message: string;
  data: PenaltyRule[];
}

/**
 * Interface cho cấu trúc response chung (khi data là MỘT OBJECT PenaltyRule)
 * Dùng cho GET /api/penalty-rules/{id} (UniStaff)
 */
export interface PenaltyRuleDataApiResponse {
  success: boolean;
  message: string;
  data: PenaltyRule;
}

/**
 * Interface cho cấu trúc response chung (khi data là rỗng)
 * Dùng cho POST, PUT, DELETE (UniStaff) và POST (Leader)
 */
export interface StandardApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null;
}

// --- INTERFACE MỚI DÀNH CHO CLUB LEADER API ---

/**
 * Định nghĩa mức đánh giá Staff Performance
 * Điểm: POOR(0.0), AVERAGE(0.4), GOOD(0.8), EXCELLENT(1.0)
 */
export type StaffPerformanceLevel = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";

/**
 * Interface cho Request Body khi tạo Phiếu Phạt
 * POST /api/clubs/{clubId}/discipline/penalties
 */
export interface CreatePenaltyBody {
  membershipId: number;
  ruleId: number;
  reason: string;
}

/**
 * Interface cho Request Body khi chấm Staff Performance
 * POST /api/clubs/{clubId}/discipline/staff-performances
 */
export interface CreateStaffPerformanceBody {
  membershipId: number;
  eventId: number;
  performance: StaffPerformanceLevel | string;
  note: string;
}

/**
 * Interface cho tham số (path) của các hàm Leader API
 */
export interface ClubIdParams {
  clubId: number;
}

/**
 * Interface cho tham số (path và body) của hàm CreatePenalty
 */
export interface CreatePenaltyParams extends ClubIdParams {
  body: CreatePenaltyBody;
}

/**
 * Interface cho tham số (path và body) của hàm CreateStaffPerformance
 */
export interface CreateStaffPerformanceParams extends ClubIdParams {
  body: CreateStaffPerformanceBody;
}

// --- CÁC HÀM API ---

// --- UNISTAFF/ADMIN API (Được giữ nguyên) ---

/**
 * Lấy danh sách tất cả rule vi phạm (UniStaff/Admin)
 * GET /api/penalty-rules
 */
export const getAllPenaltyRules = async (): Promise<PenaltyRule[]> => {
  try {
    const response = await axiosInstance.get<PenaltyRulesApiResponse>(
      "/api/penalty-rules"
    );

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }

    return [];
  } catch (error) {
    console.error("Error fetching all penalty rules:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết một rule vi phạm (UniStaff/Admin)
 * GET /api/penalty-rules/{id}
 */
export const getPenaltyRuleById = async (id: number): Promise<PenaltyRule> => {
  try {
    const response = await axiosInstance.get<PenaltyRuleDataApiResponse>(
      `/api/penalty-rules/${id}`
    );

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || `Failed to fetch penalty rule ${id}`);
  } catch (error) {
    console.error(`Error fetching penalty rule ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo rule vi phạm mới (UniStaff Only)
 * POST /api/penalty-rules
 */
export const createPenaltyRule = async (ruleData: PenaltyRuleBody): Promise<void> => {
  try {
    const response = await axiosInstance.post<StandardApiResponse>(
      "/api/penalty-rules",
      ruleData
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to create penalty rule");
    }
  } catch (error) {
    console.error("Error creating penalty rule:", error);
    throw error;
  }
};

/**
 * Cập nhật rule vi phạm (UniStaff Only)
 * PUT /api/penalty-rules/{id}
 */
export const updatePenaltyRule = async (
  id: number,
  ruleData: PenaltyRuleBody
): Promise<void> => {
  try {
    const response = await axiosInstance.put<StandardApiResponse>(
      `/api/penalty-rules/${id}`,
      ruleData
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || `Failed to update penalty rule ${id}`);
    }
  } catch (error) {
    console.error(`Error updating penalty rule ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa rule vi phạm (UniStaff Only)
 * DELETE /api/penalty-rules/{id}
 */
export const deletePenaltyRule = async (id: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/penalty-rules/${id}`
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || `Failed to delete penalty rule ${id}`);
    }
  } catch (error) {
    console.error(`Error deleting penalty rule ${id}:`, error);
    throw error;
  }
};


// --- CLUB LEADER/VICE-LEADER API (PHẦN MỚI THÊM) ---

/**
 * Leader/Vice-leader xem danh sách Rule vi phạm đã được UniStaff cấu hình
 * GET /api/clubs/{clubId}/discipline/penalty-rules
 * @param clubId - ID của CLB (path)
 * @returns Promise<PenaltyRule[]> - Mảng các rule vi phạm
 */
export const getClubPenaltyRules = async ({
  clubId,
}: ClubIdParams): Promise<PenaltyRule[]> => {
  try {
    const response = await axiosInstance.get<PenaltyRulesApiResponse>(
      `/api/clubs/${clubId}/discipline/penalty-rules`
    );


    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching club ${clubId} penalty rules:`, error);
    throw error;
  }
};

/**
 * Leader/Vice-leader tạo phiếu phạt cho thành viên trong CLB
 * POST /api/clubs/{clubId}/discipline/penalties
 * @param clubId - ID của CLB (path)
 * @param body - Dữ liệu phiếu phạt (membershipId, eventId, ruleId, reason)
 */
export const createClubPenalty = async ({
  clubId,
  body,
}: CreatePenaltyParams): Promise<void> => {
  try {
    const response = await axiosInstance.post<StandardApiResponse>(
      `/api/clubs/${clubId}/discipline/penalties`,
      body
    );


    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || `Failed to create penalty for club ${clubId}`);
    }
  } catch (error) {
    console.error(`Error creating club ${clubId} penalty:`, error);
    throw error;
  }
};

/**
 * Leader/Vice-leader chấm điểm hiệu suất làm việc của Staff trong sự kiện
 * POST /api/clubs/{clubId}/discipline/staff-performances
 * @param clubId - ID của CLB (path)
 * @param body - Dữ liệu chấm điểm (membershipId, eventId, performance, note)
 */
export const createStaffPerformance = async ({
  clubId,
  body,
}: CreateStaffPerformanceParams): Promise<void> => {
  try {
    const response = await axiosInstance.post<StandardApiResponse>(
      `/api/clubs/${clubId}/discipline/staff-performances`,
      body
    );


    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || `Failed to create staff performance for club ${clubId}`);
    }
  } catch (error) {
    console.error(`Error creating club ${clubId} staff performance:`, error);
    throw error;
  }
};