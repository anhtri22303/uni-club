import axiosInstance from "@/lib/axiosInstance"

export interface Major {
	id: number
	name: string
	description: string
	majorCode: string
	active: boolean
}
// --- Payload Types (Dùng cho Create/Update) ---
// Payload để TẠO major (không cần 'id' hoặc 'active')
export interface CreateMajorPayload {
	name: string
	description: string
	majorCode: string
}

// Payload để CẬP NHẬT major
export interface UpdateMajorPayload {
	name: string
	description: string
	majorCode: string
	active: boolean
}

export const fetchMajors = async (): Promise<Major[]> => {
	try {
		const response = await axiosInstance.get("api/university/majors")
		const body = response.data
		// Nếu backend trả về { content: [...] }
		if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
			return body.content
		}
		// Nếu backend trả về mảng trực tiếp
		if (Array.isArray(body)) return body
		// Nếu backend trả về { data: [...] }
		if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
			return body.data
		}
		return []
	} catch (error) {
		console.error("Error fetching majors:", error)
		throw error
	}
}

export const fetchMajorById = async (id: number): Promise<Major> => {
	try {
		const response = await axiosInstance.get(`api/university/majors/${id}`)
		const body: any = response.data
		if (body && typeof body === "object" && "data" in body) {
			return body.data
		}
		return body
	} catch (error) {
		console.error(`Error fetching major ${id}:`, error)
		throw error
	}
}
export const createMajor = async (payload: CreateMajorPayload): Promise<Major> => {
	try {
		// Swagger cho thấy request body không cần id/active
		const response = await axiosInstance.post<Major>("api/university/majors", payload)
		// Swagger cho thấy trả về object Major đã tạo
		return response.data
	} catch (error) {
		console.error("Error creating major:", error)
		throw error
	}
}

export const updateMajorById = async (id: number, payload: UpdateMajorPayload): Promise<Major> => {
	try {
		const response = await axiosInstance.put(`api/university/majors/${id}`, payload)
		const body: any = response.data
		// Xử lý nếu API trả về có wrapper 'data'
		if (body && typeof body === "object" && "data" in body) {
			return body.data
		}
		return body // Swagger cho thấy trả về object Major đã cập nhật
	} catch (error) {
		console.error(`Error updating major ${id}:`, error)
		throw error
	}
}

export const deleteMajorById = async (id: number): Promise<any> => {
	try {
		const response = await axiosInstance.delete(`api/university/majors/${id}`)
		// Swagger ghi 200 OK, không có response body.
		// Tuy nhiên, trang page.tsx của bạn đang kiểm tra 'res.success'
		// Chúng ta sẽ trả về data (nếu có) hoặc một object success
		return response.data || { success: true, deleted: true }
	} catch (error) {
		console.error(`Error deleting major ${id}:`, error)
		throw error
	}
}