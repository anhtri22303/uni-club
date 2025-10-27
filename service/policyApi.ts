import axiosInstance from "@/lib/axiosInstance"

export interface Policy {
	id: number
	policyName: string
	description: string
	majorId?: number
	majorName?: string
	name?: string
	maxClubJoin?: number
	rewardMultiplier?: number
	active: boolean
}

export const fetchPolicies = async (): Promise<Policy[]> => {
	try {
		const response = await axiosInstance.get("api/university/policies")
		const body = response.data
		// if backend returns { content: [...] } or similar wrapper
		if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
			return body.content
		}
		if (Array.isArray(body)) return body
		// if backend wraps payload in { data: ... }
		if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
			return body.data
		}
		return []
	} catch (error) {
		console.error("Error fetching policies:", error)
		throw error
	}
}

export const fetchPolicyById = async (id: number): Promise<Policy> => {
		try {
			const response = await axiosInstance.get(`api/university/policies/${id}`)
			const body: any = response.data
			if (body && typeof body === "object" && "data" in body) {
				return body.data
			}
			return body
		} catch (error) {
		console.error(`Error fetching policy ${id}:`, error)
		throw error
	}
}

export const createPolicy = async (payload: Partial<Policy>) => {
	try {
		const response = await axiosInstance.post(`api/university/policies`, payload)
		return response.data as any
	} catch (error) {
		console.error("Error creating policy:", error)
		throw error
	}
}

export const updatePolicyById = async (id: number, payload: Partial<Policy>) => {
	try {
		const response = await axiosInstance.put(`api/university/policies/${id}`, payload)
		// Normalize response so callers can rely on success/status/data/message
		const raw: any = response.data
		const normalized = {
			status: response.status,
			data: raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw,
			message: raw && typeof raw === 'object' ? raw.message ?? undefined : undefined,
			success: raw && typeof raw === 'object' && 'success' in raw ? !!raw.success : (response.status >= 200 && response.status < 300),
		}
		return normalized as any
	} catch (error) {
		console.error(`Error updating policy ${id}:`, error)
		throw error
	}
}

export const deletePolicyById = async (id: number) => {
	try {
		const response = await axiosInstance.delete(`api/university/policies/${id}`)
		return response.data as any
	} catch (error) {
		console.error(`Error deleting policy ${id}:`, error)
		throw error
	}
}

