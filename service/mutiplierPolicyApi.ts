import axiosInstance from "@/lib/axiosInstance"

export type PolicyTargetType = "CLUB" | "MEMBER"

export interface MultiplierPolicy {
  id: number
  targetType: PolicyTargetType
  levelOrStatus: string
  minEvents: number
  multiplier: number
  updatedBy: string
  updatedAt: string
  effectiveFrom: string
}

export interface MultiplierPoliciesApiResponse {
  success?: boolean
  message?: string
  data?: MultiplierPolicy[]
  content?: MultiplierPolicy[]
}

export const getMutiplierPolicy = async (
  type: PolicyTargetType
): Promise<MultiplierPolicy[]> => {
  try {
    const response = await axiosInstance.get<
      MultiplierPoliciesApiResponse | MultiplierPolicy[]
    >(`/api/admin/policies/${type}`)
    
    console.log("Fetched multiplier policies response:", response.data)
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    if (response.data && typeof response.data === "object") {
      if ("data" in response.data && response.data.data) {
        return response.data.data
      }
      if ("content" in response.data && response.data.content) {
        return response.data.content
      }
    }
    
    return []
  } catch (error) {
    console.error("Error fetching multiplier policies:", error)
    throw error
  }
}

export const updateMultiplierPolicy = async (
  id: number,
  payload: Partial<MultiplierPolicy>
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.put<MultiplierPolicy>(
      `/api/admin/policies/${id}`,
      payload
    )
    console.log("Updated multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error updating multiplier policy:", error)
    throw error
  }
}

export interface MultiplierPolicyApiResponse {
  success: boolean
  message: string
  data: MultiplierPolicy
}

export interface CreateMultiplierPolicyPayload {
  targetType: PolicyTargetType
  levelOrStatus: string
  minEvents: number
  multiplier: number
  effectiveFrom: string
}

export const createMultiplierPolicy = async (
  payload: Omit<MultiplierPolicy, "id" | "updatedBy" | "updatedAt">
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.post<MultiplierPolicy>(
      `/api/admin/policies`,
      payload
    )
    console.log("Created multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error creating multiplier policy:", error)
    throw error
  }
}

export const postMutiplierPolicy = async (
  payload: CreateMultiplierPolicyPayload
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.post<MultiplierPolicy>(
      `/api/admin/policies`,
      payload
    )
    console.log("Created multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error creating multiplier policy:", error)
    throw error
  }
}

export interface UpdateMultiplierPolicyPayload {
  id: number
  multiplier: number
  updatedBy: string
}

export const putMutiplierPolicy = async (
  id: number,
  payload: UpdateMultiplierPolicyPayload
): Promise<MultiplierPolicy> => {
  try {
    const response = await axiosInstance.put<MultiplierPolicy>(
      `/api/admin/policies/${id}`,
      payload
    )
    console.log("Updated multiplier policy response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error updating multiplier policy:", error)
    throw error
  }
}

export interface DeleteMultiplierPolicyApiResponse {
  success: boolean
  message: string
  data: string
}

export const deleteMutiplierPolicy = async (id: number): Promise<string> => {
  try {
    const response = await axiosInstance.delete<DeleteMultiplierPolicyApiResponse>(
      `/api/admin/policies/${id}`
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

