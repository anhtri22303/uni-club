import axiosInstance from "@/lib/axiosInstance"

// Interface đã được cập nhật theo Swagger
// Loại bỏ 'name' và 'rewardMultiplier'
export interface Policy {
    id: number
    policyName: string
    description: string
    majorId?: number
    majorName?: string
    maxClubJoin?: number
    active: boolean
}

const API_PATH = "api/university/major-policies"

// export const fetchPolicies = async (): Promise<Policy[]> => {
//     try {
//         // Path đã được cập nhật
//         const response = await axiosInstance.get(API_PATH)
//         const body = response.data
//         // Giữ lại logic kiểm tra wrapper để đảm bảo an toàn
//         if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
//             return body.content
//         }
//         if (Array.isArray(body)) return body
//         if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
//             return body.data
//         }
//         return []
//     } catch (error) {
//         console.error("Error fetching policies:", error)
//         throw error
//     }
// }
export const fetchPolicies = async (): Promise<Policy[]> => {
    try {
        const response = await axiosInstance.get(API_PATH)
        // Cập nhật: Swagger (image_4286a7.png) cho thấy response là một mảng Policy[] trực tiếp
        // Loại bỏ logic kiểm tra wrapper 'content' hoặc 'data'
        return response.data as Policy[]
    } catch (error) {
        console.error("Error fetching policies:", error)
        throw error
    }
}

// export const fetchPolicyById = async (id: number): Promise<Policy> => {
//     try {
//         // Path đã được cập nhật
//         const response = await axiosInstance.get(`${API_PATH}/${id}`)
//         const body: any = response.data
//         // Giữ lại logic kiểm tra wrapper
//         if (body && typeof body === "object" && "data" in body) {
//             return body.data
//         }
//         return body
//     } catch (error) {
//         console.error(`Error fetching policy ${id}:`, error)
//         throw error
//     }
// }
export const fetchPolicyById = async (id: number): Promise<Policy> => {
        try {
            const response = await axiosInstance.get(`${API_PATH}/${id}`)
            // Cập nhật: Swagger (image_4286e5.png) cho thấy response là một object Policy trực tiếp
            // Loại bỏ logic kiểm tra wrapper 'data'
            return response.data as Policy
        } catch (error) {
            console.error(`Error fetching policy ${id}:`, error)
            throw error
        }
}

export const createPolicy = async (payload: Partial<Policy>): Promise<Policy> => {
    try {
        // Path đã được cập nhật
        // Swagger cho thấy response là object Policy đã tạo
        const response = await axiosInstance.post(API_PATH, payload)
        return response.data as Policy
    } catch (error) {
        console.error("Error creating policy:", error)
        throw error
    }
}

export const updatePolicyById = async (id: number, payload: Partial<Policy>): Promise<Policy> => {
    try {
        // Path đã được cập nhật
        const response = await axiosInstance.put(`${API_PATH}/${id}`, payload)
        // Swagger (image d17067.png) cho thấy response là object Policy đã cập nhật
        // Đã loại bỏ logic chuẩn hóa (normalization) phức tạp
        return response.data as Policy
    } catch (error) {
        console.error(`Error updating policy ${id}:`, error)
        throw error
    }
}

export const deletePolicyById = async (id: number): Promise<void> => {
    try {
        // Cập nhật: Swagger (image_428dca.png) cho thấy response 200 OK không có body
        await axiosInstance.delete(`${API_PATH}/${id}`)
        // Không return gì cả
    } catch (error) {
        console.error(`Error deleting policy ${id}:`, error)
        throw error
    }
}