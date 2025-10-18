import axiosInstance from "@/lib/axiosInstance"

export const fetchEvent = async ({ page = 0, size = 10, sort = "name" } = {}) => {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack;
  console.log(`🚀 fetchEvent called at ${timestamp}`);
  console.log(`📍 Call stack:`, stack?.split('\n').slice(1, 4).join('\n'));

  try {
    const response = await axiosInstance.get("api/events", {
      params: {
        page,
        size,
        sort,
      },
    });
    const data: any = response.data;
    console.log(`✅ fetchEvent completed at ${new Date().toISOString()}:`, data);
    
    // Response structure: { content: [...], pageable: {...}, ... }
    // Always return the content array for event list
    if (data && Array.isArray(data.content)) return data.content;
    
    // Fallback: if direct array
    if (Array.isArray(data)) return data;
    
    // Fallback: if data.data.content
    if (data?.data && Array.isArray(data.data.content)) return data.data.content;
    
    // Fallback: empty array
    return [];
  } catch (error) {
    console.error(`❌ fetchEvent error at ${new Date().toISOString()}:`, error);
    throw error;
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
    // Response structure: { success: true, message: "success", data: { id, clubId, name, description, type, date, time, status, locationId, locationName, checkInCode, maxCheckInCount, currentCheckInCount } }
    // Always return the data object when present
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
	// call the correct endpoint: /api/events/code/{code}
	try {
		const response = await axiosInstance.get(`/api/events/code/${encodeURIComponent(code)}`)
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
