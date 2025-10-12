import axiosInstance from "@/lib/axiosInstance"

export type ApiMembership = {
	membershipId: number
	userId: number
	clubId: number
	level: string
	state: string
	staff: boolean
}

export const getClubMembers = async (): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get("/api/memberships/my-club")
	// backend returns { success, message, data }
	const body: any = res.data
    console.log("club members:", body)
	return body?.data || []
}

export const getClubMemberById = async (clubId: number): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get(`/api/memberships/club/${clubId}`)
	// backend returns { success, message, data }
	const body: any = res.data
    console.log("club members by id:", body)
	return body?.data || []
}

export default {
	getClubMembers,
	getClubMemberById,
}

