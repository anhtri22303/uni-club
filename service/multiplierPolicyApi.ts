import axiosInstance from "@/lib/axiosInstance"

export type PolicyTargetType = "CLUB" | "MEMBER"
export type ConditionType = "PERCENTAGE" | "ABSOLUTE"

// CẬP NHẬT: Loại bỏ trường 'name'
export interface MultiplierPolicy {
    id: number
    targetType: PolicyTargetType
    // Cập nhật theo Swagger mới: Bỏ 'name', Giữ 'levelEvaluation'
    levelEvaluation: string 
    activityType: string
    ruleName: string
    conditionType: ConditionType
    minThreshold: number
    maxThreshold: number
    policyDescription?: string | null 
    multiplier: number
    active: boolean
    updatedBy: string
}

// Định nghĩa lại kiểu dữ liệu mà API có thể trả về
export type MultiplierPoliciesApiResponse = {
    success?: boolean
    message?: string
    data?: MultiplierPolicy[] // Trường hợp API trả về object có chứa 'data'
    content?: MultiplierPolicy[] // Trường hợp API trả về object có chứa 'content'
} | MultiplierPolicy[] // Trường hợp API trả về trực tiếp Array

/**
 * Lấy danh sách tất cả multiplier policies
 * GET /api/university/multiplier-policies
 */
export const getMutiplierPolicy = async (): Promise<MultiplierPolicy[]> => {
    try {
        const response = await axiosInstance.get<MultiplierPoliciesApiResponse>(
            `/api/university/multiplier-policies`
        )

        const responseData = response.data;

        console.log("Fetched multiplier policies response:", responseData)

        if (Array.isArray(responseData)) {
            return responseData
        }

        if (responseData && 'content' in responseData && Array.isArray(responseData.content)) {
            return responseData.content
        }
        if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
            return responseData.data
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
        const response = await axiosInstance.get<MultiplierPoliciesApiResponse>(
            `/api/university/multiplier-policies/target/${type}`
        )

        const responseData = response.data;

        console.log("Fetched multiplier policies by type response:", responseData)

        if (Array.isArray(responseData)) {
            return responseData
        }
        
        if (responseData && 'content' in responseData && Array.isArray(responseData.content)) {
            return responseData.content
        }
        if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
            return responseData.data
        }

        return []
    } catch (error) {
        console.error("Error fetching multiplier policies by type:", error)
        throw error
    }
}

// Interface cho dữ liệu cần gửi khi TẠO mới (POST)
// Omit 'id', 'updatedBy' (giả định updatedBy được server tự thêm)
export type CreateMultiplierPolicyPayload = Omit<MultiplierPolicy, "id" | "updatedBy"> & {
    updatedBy?: string 
}

/**
 * Tạo một multiplier policy mới
 * POST /api/university/multiplier-policies
 * @param payload - Dữ liệu của policy mới (không bao gồm id)
 */
export const createMultiplierPolicy = async (
    payload: CreateMultiplierPolicyPayload
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

// Interface cho dữ liệu cần gửi khi CẬP NHẬT (PUT)
// Vẫn chỉ bao gồm các trường được Swagger cho phép chỉnh sửa.
export type UpdateMultiplierPolicyPayload = Partial<
    Pick<
        MultiplierPolicy,
        | "ruleName"
        | "multiplier"
        | "minThreshold"
        | "maxThreshold"
        | "active"
        | "policyDescription"
        | "updatedBy"
    >
>

/**
 * Cập nhật một multiplier policy
 * PUT /api/university/multiplier-policies/{id}
 * @param id - ID của policy cần cập nhật
 * @param payload - Dữ liệu cập nhật (chỉ các trường cho phép)
 */
export const updateMultiplierPolicy = async (
    id: number,
    payload: UpdateMultiplierPolicyPayload
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

        if (response.data && response.data.success) {
            return response.data.data
        }

        if (response.status === 200) {
            return "Policy deleted successfully"
        }

        throw new Error(response.data?.message || "Failed to delete multiplier policy")
    } catch (error) {
        console.error("Error deleting multiplier policy:", error)
        throw error
    }
}