import axiosInstance from "@/lib/axiosInstance"

export const fetchEvent = async () => {
  const timestamp = new Date().toISOString()
  const stack = new Error().stack
  console.log(`🚀 fetchEvent called at ${timestamp}`)
  console.log(`📍 Call stack:`, stack?.split('\n').slice(1, 4).join('\n'))
  
  try {
    const response = await axiosInstance.get("api/events")
    // If the API uses pagination, the events array may be in `response.data.content`
    const data: any = response.data
    console.log(`✅ fetchEvent completed at ${new Date().toISOString()}:`, data)
    if (data && Array.isArray(data)) return data
    if (data && Array.isArray(data.content)) return data.content
    // Fallback to returning the raw data
    return data
  } catch (error) {
    console.error(`❌ fetchEvent error at ${new Date().toISOString()}:`, error)
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

export const putEventStatus = async (id: string | number, status: string) => {
  try {
    const response = await axiosInstance.put(`api/events/${id}/status`, { status })
    const data: any = response.data
    console.log(`Updated event ${id} status -> ${status}:`, data)
    // normalize
    if (data && data.data) return data.data
    return data
  } catch (error) {
    console.error(`Error updating event ${id} status:`, error)
    throw error
  }
}

export const getEventByCode = async (code: string) => {
	// call the endpoint used in your screenshot: /api/events/checkin/{code}
	try {
		const response = await axiosInstance.get(`/api/events/checkin/${encodeURIComponent(code)}`)
		const resData: any = response.data
		console.debug(`Fetched event by code ${code}:`, resData)
		// expected response shape:
		// { success: true, message: null, data: { ...event fields... } }
		if (resData?.success && resData?.data) return resData.data
		// fallback: if API returns raw event object
		if (resData && typeof resData === "object" && (resData.id || resData.name)) return resData
		throw new Error(resData?.message || "Event not found")
	} catch (err) {
		console.error(`Error fetching event by code ${code}:`, err)
		throw err
	}
}

export const getEventByClubId = async (clubId: string | number) => {
	try {
		const response = await axiosInstance.get(`/api/events/club/${clubId}`)
		const resData: any = response.data
		console.log(`Fetched events for club ${clubId}:`, resData)
		
		// If response is direct array of events
		if (Array.isArray(resData)) return resData
		
		// If response has wrapper structure like { success, data, message }
		if (resData?.data && Array.isArray(resData.data)) return resData.data
		
		// If response has content property (pagination)
		if (resData?.content && Array.isArray(resData.content)) return resData.content
		
		// Fallback to empty array if no events found
		return []
	} catch (error) {
		console.error(`Error fetching events for club ${clubId}:`, error)
		throw error
	}
}
