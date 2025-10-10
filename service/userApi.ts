import axiosInstance from "@/lib/axiosInstance"


export const fetchUser = async () => {
  try {
    const response = await axiosInstance.get("api/users")
    const body = response.data
    console.log("Fetched users response:", body)

    // If backend returns a paginated wrapper, return the `content` array.
    if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
      console.log("fetchUser returning body.content (array)")
      return body.content
    }

    // If the API already returns an array of users, return it directly.
    if (Array.isArray(body)) {
      return body
    }

    // Fallback: return empty array to simplify caller logic
    return []
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

// New: fetchProfile - returns the current authenticated user's profile (unwrapped `data`)
export const fetchProfile = async () => {
  try {
    const response = await axiosInstance.get("api/users/profile")
    const body = response.data
    console.log("Fetched profile response:", body)

    // If backend uses { success, message, data }
    if (body && typeof body === "object" && "data" in body) {
      return body.data
    }

    // If the endpoint returns the profile object directly
    if (body && typeof body === "object") {
      return body
    }

    return null
  } catch (error) {
    console.error("Error fetching profile:", error)
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
    console.log("fetchUserById:", body)
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

export const deleteUserById = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`api/users/${id}`)
    // expected: response.data may contain { success, message, deleted }
    return response.data as any
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error)
    throw error
  }
}
