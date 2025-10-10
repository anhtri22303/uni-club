import axiosInstance from "@/lib/axiosInstance"

export type ApiMembership = {
	membershipId: number
	userId: number
	clubId: number
	level: string
	state: string
	staff: boolean
}

export const getMyClubMembers = async (): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get("/api/memberships/my-club")
	// backend returns { success, message, data }
	const body: any = res.data
    console.log("body", body)
	return body?.data || []
}

export default {
	getMyClubMembers,
}

