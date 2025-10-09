import axiosInstance from "@/lib/axiosInstance"

export const fetchEvent = async () => {
  try {
    const response = await axiosInstance.get("api/events")
    // If the API uses pagination, the events array may be in `response.data.content`
  const data: any = response.data
    console.log("Fetched events:", data)
  if (data && Array.isArray(data)) return data
  if (data && Array.isArray(data.content)) return data.content
    // Fallback to returning the raw data
    return data
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

export const createEvent = async (payload: any) => {
  try {
    const response = await axiosInstance.post("api/events", payload)
    const data: any = response.data
    console.log("Create event response:", data)
    return data
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export const getEventById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`api/events/${id}`)
    const resData: any = response.data
    console.log(`Fetched event ${id}:`, resData)
    // Some backends wrap the payload in { success, message, data }
    // Normalize to return the inner event object when present.
    if (resData && resData.data) return resData.data
    return resData
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error)
    throw error
  }
}
