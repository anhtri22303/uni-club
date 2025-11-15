import axiosInstance from "@/lib/axiosInstance"

export type PolicyTargetType = "CLUB" | "MEMBER"
export type ConditionType = "PERCENTAGE" | "ABSOLUTE"

export interface MultiplierPolicy {
  id: number
  targetType: PolicyTargetType
  // Các trường mới dựa trên Swagger
  activityType: string
  ruleName: string
  conditionType: ConditionType
  minThreshold: number
  maxThreshold: number
  policyDescription?: string | null // Thêm mới (để optional)
  // Các trường cũ được giữ lại
  multiplier: number
  active: boolean
  updatedBy: string
}

export interface MultiplierPoliciesApiResponse {
  success?: boolean
  message?: string
  data?: MultiplierPolicy[]
  content?: MultiplierPolicy[]
}

/**
 * Lấy danh sách tất cả multiplier policies
 * GET /api/university/multiplier-policies
 */
export const getMutiplierPolicy = async (): Promise<MultiplierPolicy[]> => {
  try {
    const response = await axiosInstance.get<MultiplierPolicy[]>(
      `/api/university/multiplier-policies`
    )

    console.log("Fetched multiplier policies response:", response.data)

    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data
    }

    return []
  } catch (error) {
    console.error("Error fetching multiplier policies:", error)
    throw error
  }
}

/**
 * Lấy chi tiết một multiplier policy bằng ID
 * GET /api/university/multiplier-policies/{id}
 * @param id - ID của policy
 */
export const getMutiplierPolicyById = async (
  id: number
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.get<MultiplierPolicy>(
      `/api/university/multiplier-policies/${id}`
    )
    console.log("Fetched multiplier policy by ID response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching multiplier policy by ID:", error)
    throw error
  }
}

/**
 * Lấy danh sách các multiplier policies theo target type (CLUB hoặc MEMBER)
 * GET /api/university/multiplier-policies/target/{type}
 * @param type - Loại target (CLUB | MEMBER)
 */
export const getMutiplierPolicyByType = async (
  type: PolicyTargetType
): Promise<MultiplierPolicy[]> => {
  try {
    const response = await axiosInstance.get<MultiplierPolicy[]>(
      `/api/university/multiplier-policies/target/${type}`
    )
    console.log("Fetched multiplier policies by type response:", response.data)

    if (Array.isArray(response.data)) {
      return response.data
    }
    return []
  } catch (error) {
    console.error("Error fetching multiplier policies by type:", error)
    throw error
  }
}

/**
 * Tạo một multiplier policy mới
 * POST /api/university/multiplier-policies
 * @param payload - Dữ liệu của policy mới
 */
export const createMultiplierPolicy = async (
  payload: Omit<MultiplierPolicy, "id"> // Cập nhật: Chỉ Omit 'id'
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.post<MultiplierPolicy>(
      `/api/university/multiplier-policies`,
      payload
    )
    console.log("Created multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error creating multiplier policy:", error)
    throw error
  }
}

/**
 * Cập nhật một multiplier policy
 * PUT /api/university/multiplier-policies/{id}
 * @param id - ID của policy cần cập nhật
 * @param payload - Dữ liệu cập nhật (một phần hoặc toàn bộ)
 */
export const updateMultiplierPolicy = async (
  id: number,
  payload: Partial<MultiplierPolicy> // Partial tự động xử lý các trường mới
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.put<MultiplierPolicy>(
      `/api/university/multiplier-policies/${id}`,
      payload
    )
    console.log("Updated multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error updating multiplier policy:", error)
    throw error
  }
}

// Interface cho response khi xoá
export interface DeleteMultiplierPolicyApiResponse {
  success: boolean
  message: string
  data: string
}

/**
 * Xoá một multiplier policy
 * DELETE /api/university/multiplier-policies/{id}
 * @param id - ID của policy cần xoá
 */
export const deleteMutiplierPolicy = async (id: number): Promise<string> => {
  try {
    const response = await axiosInstance.delete<DeleteMultiplierPolicyApiResponse>(
      `/api/university/multiplier-policies/${id}`
    )
    console.log("Deleted multiplier policy response:", response.data)

    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.message || "Failed to delete multiplier policy")
  } catch (error) {
    console.error("Error deleting multiplier policy:", error)
    throw error
  }
}