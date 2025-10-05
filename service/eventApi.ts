import axiosInstance from "@/lib/axiosInstance"

export const fetchEvent = async () => {
  try {
    const response = await axiosInstance.get("api/events")
    console.log("Fetched events:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}
