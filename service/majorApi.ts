import axiosInstance from "@/lib/axiosInstance"

export interface Major {
	id: number
	name: string
	description: string
	active: boolean
}

/**
 * Lấy danh sách tất cả majors
 */
export const fetchMajors = async (): Promise<Major[]> => {
	try {
		console.log("fetchMajors: GET api/university/majors")
		const response = await axiosInstance.get("api/university/majors")
		const body = response.data
		console.log("fetchMajors response:", body)

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

/**
 * Lấy thông tin 1 major theo ID
 */
export const fetchMajorById = async (id: number): Promise<Major> => {
	try {
		console.log(`fetchMajorById: GET api/university/majors/${id}`)
		const response = await axiosInstance.get(`api/university/majors/${id}`)
		const body: any = response.data
		console.log("fetchMajorById response:", body)

		if (body && typeof body === "object" && "data" in body) {
			return body.data
		}
		return body
	} catch (error) {
		console.error(`Error fetching major ${id}:`, error)
		throw error
	}
}
