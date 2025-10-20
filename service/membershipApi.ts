import axiosInstance from "@/lib/axiosInstance"

export type ApiClub = {
  id: number;
  name: string;
}
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
	email?: string
	avatarUrl?: string
	major?: string
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
	getMembersByClubId,
}

