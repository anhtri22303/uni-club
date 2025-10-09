import axiosInstance from "@/lib/axiosInstance"

export const fetchClub = async (pageable: { page?: number; size?: number; sort?: string[] } = { page: 0, size: 10, sort: ["name"] }) => {
  try {
    // The API expects a `pageable` query parameter (object). We stringify it to match the backend contract.
    const response = await axiosInstance.get("api/clubs", {
      params: {
        pageable: JSON.stringify({
          page: pageable.page ?? 0,
          size: pageable.size ?? 10,
          sort: pageable.sort ?? ["name"],
        }),
      },
    })

    console.log("Fetched clubs:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching clubs:", error)
    throw error
  }
}

// Tạo club mới (POST)
export const createClub = async (clubData: { name: string; description: string; majorPolicyId?: number; majorName?: string }) => {
  try {
    // Support sending either majorPolicyId or majorName depending on backend changes
    const payload: any = {
      name: clubData.name,
      description: clubData.description,
    }
    if (clubData.majorPolicyId !== undefined) payload.majorPolicyId = clubData.majorPolicyId
    if (clubData.majorName !== undefined) payload.majorName = clubData.majorName

    const response = await axiosInstance.post("/api/clubs", payload)
    return response.data
  } catch (error) {
    console.error("Error creating club:", error)
    throw error
  }
}

// Cập nhật club (PUT)
export const updateClub = async (id: string | number, clubData: { name?: string; description?: string; majorPolicyId?: number; majorName?: string }) => {
  try {
    const payload: any = { ...clubData }
    const response = await axiosInstance.put(`/api/clubs/${id}`, payload)
    return response.data
  } catch (error) {
    console.error("Error updating club:", error)
    throw error
  }
}

// Xóa club theo id
export const deleteClub = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`/api/clubs/${id}`)
    return response.data
  } catch (error) {
    console.error("Error deleting club:", error)
    throw error
  }
}
