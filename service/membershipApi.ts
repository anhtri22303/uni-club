import axiosInstance from "@/lib/axiosInstance"


export type ApiMembership = {
	membershipId: number
	userId: number
	clubId: number
	clubRole: "LEADER" | "MEMBER" | string
	state: "ACTIVE" | "PENDING" | "REJECTED" | string
	staff: boolean
	joinedDate?: string
	endDate?: string
	fullName: string
	studentCode: string
	clubName: string
}


// Lấy thành viên trong CLB mà leader đang quản lý
export const getMyClubMembers = async (): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get("/api/membership/my-clubs")
	const body: any = res.data
	console.log("Fetched my club members:", body)
	return body?.data || []
}


export const getClubMembers = async (): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get("/api/memberships/my-club")
	// backend returns { success, message, data }
	const body: any = res.data
	console.log("club members:", body)
	return body?.data || []
}

export const getMembersByClubId = async (clubId: number): Promise<ApiMembership[]> => {
	const res = await axiosInstance.get(`/api/clubs/${clubId}/members`)
	const body: any = res.data

	console.log("Fetched all club members:", body)

	if (!body?.success) {
		throw new Error(body?.message || "Failed to fetch club members")
	}

	return body.data || []
}

export default {
	getClubMembers,
	getMyClubMembers,
	getMembersByClubId,

}

