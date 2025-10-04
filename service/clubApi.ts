import axiosInstance from "@/lib/axiosInstance"

export const fetchClub = async () => {
  try {
    const response = await axiosInstance.get("api/clubs")
    console.log("Fetched clubs:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching clubs:", error)
    throw error
  }
}
