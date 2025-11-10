import axiosInstance from "@/lib/axiosInstance"

export type PolicyTargetType = "CLUB" | "MEMBER"

export interface MultiplierPolicy {
  id: number
  targetType: PolicyTargetType
  levelOrStatus: string
  minEvents: number
  multiplier: number
  active: boolean
  updatedBy: string
  updatedAt?: string
  effectiveFrom?: string
}

export interface MultiplierPoliciesApiResponse {
  success?: boolean
  message?: string
  data?: MultiplierPolicy[]
  content?: MultiplierPolicy[]
}

// Get all multiplier policies from the new university endpoint
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

// Legacy function for backward compatibility - filters by type
export const getMutiplierPolicyByType = async (
  type: PolicyTargetType
): Promise<MultiplierPolicy[]> => {
  try {
    const allPolicies = await getMutiplierPolicy()
    return allPolicies.filter(policy => policy.targetType === type)
  } catch (error) {
    console.error("Error fetching multiplier policies by type:", error)
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

export const postMutiplierPolicy = async (
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
