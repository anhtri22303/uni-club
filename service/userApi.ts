import axiosInstance from "@/lib/axiosInstance"


export const fetchUser = async () => {
  try {
    const response = await axiosInstance.get("api/users")
    console.log("Fetched users:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}
