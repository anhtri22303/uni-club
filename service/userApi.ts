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

export const fetchUserById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`api/users/${id}`)
    // expected: response.data is user object
    // If the backend wraps payload in { success, message, data }, unwrap it.
    const body = response.data
    // Always log the raw response body for easier debugging
    console.log("fetchUserById response body:", body)
    if (body && typeof body === "object" && "data" in body) {
      console.log("fetchUserById unwrapped data:", body.data)
      return body.data
    }
    console.log("fetchUserById returned raw body:", body)
    return body
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error)
    throw error
  }
}

export const updateUserById = async (id: string | number, data: Record<string, any>) => {
  try {
    const response = await axiosInstance.put(`api/users/${id}`, data)
    // expected: response.data has { success, message, data }
    return response.data as any
  } catch (error) {
    console.error(`Error updating user ${id}:`, error)
    throw error
  }
}
