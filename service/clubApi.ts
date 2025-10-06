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
