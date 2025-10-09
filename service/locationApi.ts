import axiosInstance from "@/lib/axiosInstance"

export const fetchLocation = async (pageable: { page?: number; size?: number; sort?: string[] } = { page: 0, size: 10, sort: ["name"] }) => {
  try {
    const response = await axiosInstance.get("api/locations", {
      params: {
        pageable: JSON.stringify({
          page: pageable.page ?? 0,
          size: pageable.size ?? 10,
          sort: pageable.sort ?? ["name"],
        }),
      },
    })

    console.log("Fetched locations:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching locations:", error)
    throw error
  }
}
