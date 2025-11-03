import axiosInstance from "@/lib/axiosInstance"

// Time object format for API requests/responses
export interface TimeObject {
  hour: number
  minute: number
  second: number
  nano: number
}

export interface Event {
  id: number
  name: string
  description: string
  type: "PUBLIC" | "PRIVATE" | string
  date: string
  startTime: TimeObject | string | null
  endTime: TimeObject | string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | string
  checkInCode: string
  locationName: string
  maxCheckInCount: number
  currentCheckInCount: number
  budgetPoints: number
  commitPointCost: number
  hostClub: {
    id: number
    name: string
    coHostStatus?: string
  }
  coHostedClubs?: Array<{
    id: number
    name: string
    coHostStatus: string
  }>
  // Legacy fields for backward compatibility
  clubId?: number
  clubName?: string
  time?: string
  locationId?: number
}

export interface CreateEventPayload {
  hostClubId: number
  coHostClubIds?: number[]
  name: string
  description: string
  type: "PUBLIC" | "PRIVATE"
  date: string // Format: YYYY-MM-DD
  startTime: string  // Format: HH:MM (e.g., "09:00")
  endTime: string    // Format: HH:MM (e.g., "15:00")
  locationId: number
  maxCheckInCount: number
  commitPointCost: number
  budgetPoints: number
}

// Helper function to convert time string (HH:MM:SS or HH:MM) to TimeObject
export const timeStringToObject = (timeStr: string): TimeObject => {
  const parts = timeStr.split(':').map(Number)
  return {
    hour: parts[0] || 0,
    minute: parts[1] || 0,
    second: parts[2] || 0,
    nano: 0
  }
}

// Helper function to convert TimeObject to time string (HH:MM:SS)
export const timeObjectToString = (timeObj: TimeObject | string | null): string => {
  if (!timeObj) return "00:00:00"
  if (typeof timeObj === 'string') return timeObj
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(timeObj.hour)}:${pad(timeObj.minute)}:${pad(timeObj.second)}`
}

export const fetchEvent = async ({ page = 0, size = 70, sort = "name" } = {}): Promise<Event[]> => {
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
    console.log(`fetchEvent at ${new Date().toISOString()}:`, data);
    
    // Log first event to check structure
    if (data?.content?.[0]) {
      console.log("First event in response:", data.content[0]);
      console.log("commitPointCost in first event:", data.content[0].commitPointCost);
    }

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

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  try {
    const response = await axiosInstance.post("api/events", payload)
    const data: any = response.data
    console.log("Create event response:", data)
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data?.data) return data.data
    return data
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export const getEventById = async (id: string | number): Promise<Event> => {
  try {
    const response = await axiosInstance.get(`api/events/${id}`)
    const resData: any = response.data
    console.log(`Fetched event ${id}:`, resData)
    // Response structure: { success: true, message: "success", data: { id, name, description, type, date, startTime, endTime, status, locationName, checkInCode, maxCheckInCount, currentCheckInCount, hostClub: { id, name } } }
    // Always return the data object when present
    if (resData && resData.data) return resData.data
    return resData
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error)
    throw error
  }
}

export const putEventStatus = async (id: string | number, status: string, budgetPoints: number = 0): Promise<Event> => {
  try {
    const response = await axiosInstance.put(`api/events/${id}/status`, { status, budgetPoints })
    const data: any = response.data
    console.log(`Updated event ${id} status -> ${status} with budgetPoints: ${budgetPoints}:`, data)
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data && data.data) return data.data
    return data
  } catch (error) {
    console.error(`Error updating event ${id} status:`, error)
    throw error
  }
}

export const getEventByCode = async (code: string): Promise<Event> => {
  // call the correct endpoint: /api/events/code/{code}
  try {
    const response = await axiosInstance.get(`/api/events/code/${encodeURIComponent(code)}`)
    const resData: any = response.data
    console.debug(`Fetched event by code ${code}:`, resData)
    // Expected response shape: { success: true, message: null, data: {...event} }
    if (resData?.success && resData?.data) return resData.data
    // Fallback: if API returns raw event object
    if (resData && typeof resData === "object" && (resData.id || resData.name)) return resData
    throw new Error(resData?.message || "Event not found")
  } catch (err) {
    console.error(`Error fetching event by code ${code}:`, err)
    throw err
  }
}

export const getEventByClubId = async (clubId: string | number): Promise<Event[]> => {
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

export const getEventCoHost = async (clubId: string | number): Promise<Event[]> => {
  try {
    const response = await axiosInstance.get(`/api/events/club/${clubId}/cohost`)
    const resData: any = response.data
    console.log(`Fetched co-host events for club ${clubId}:`, resData)

    // If response is direct array of events
    if (Array.isArray(resData)) return resData

    // If response has wrapper structure like { success, data, message }
    if (resData?.data && Array.isArray(resData.data)) return resData.data

    // If response has content property (pagination)
    if (resData?.content && Array.isArray(resData.content)) return resData.content

    // Fallback to empty array if no events found
    return []
  } catch (error) {
    console.error(`Error fetching co-host events for club ${clubId}:`, error)
    throw error
  }
}

export const updateEvent = async (id: string | number, payload: Partial<CreateEventPayload>): Promise<Event> => {
  try {
    const response = await axiosInstance.put(`api/events/${id}`, payload)
    const data: any = response.data
    console.log(`Updated event ${id}:`, data)
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data?.data) return data.data
    return data
  } catch (error) {
    console.error(`Error updating event ${id}:`, error)
    throw error
  }
}

export const deleteEvent = async (id: string | number): Promise<void> => {
  try {
    await axiosInstance.delete(`api/events/${id}`)
    console.log(`Deleted event ${id}`)
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error)
    throw error
  }
}

export const submitForUniversityApproval = async (eventId: string | number) => {
  // Đây là ví dụ, bạn cần API endpoint thực tế
    const response = await axiosInstance.put(`/events/${eventId}/submit-to-staff`)
    const data: any = response.data
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data && data.data) return data.data
    return data
  // return api.put(`/events/${eventId}/submit-to-staff`)
}

/**
 * Respond to co-host invitation (accept or reject)
 * @param eventId - Event ID
 * @param accept - true to accept, false to reject
 * @returns { success: boolean, message: string, data: string }
 */
export const coHostRespond = async (eventId: string | number, accept: boolean) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/cohost/respond`, null, {
      params: { accept }
    })
    const data: any = response.data
    console.log(`${accept ? 'Accepted' : 'Rejected'} co-host invitation for event ${eventId}:`, data)
    // Response structure: { success: true, message: "string", data: "string" }
    return data
  } catch (error) {
    console.error(`Error responding to co-host invitation for event ${eventId}:`, error)
    throw error
  }
}

export interface EventWalletTransaction {
  id: number
  type: string
  amount: number
  description: string
  createdAt: string
}

export interface EventWallet {
  eventId: number
  eventName: string
  hostClubName: string
  budgetPoints: number
  balancePoints: number
  ownerType: string
  createdAt: string
  transactions: EventWalletTransaction[]
}

export const getEventWallet = async (eventId: string | number): Promise<EventWallet> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/wallet/detail`)
    const data: any = response.data
    console.log(`Fetched wallet for event ${eventId}:`, data)
    // Response structure: { success: true, message: "success", data: {...wallet} }
    if (data?.data) return data.data
    return data
  } catch (error) {
    console.error(`Error fetching wallet for event ${eventId}:`, error)
    throw error
  }
}

export const registerForEvent = async (eventId: string | number) => {
  try {
    const response = await axiosInstance.post(`/api/events/register`, { eventId })
    const data: any = response.data
    console.log(`Registered for event ${eventId}:`, data)
    // Response structure: { success: true, message: "string", data: "string" }
    return data
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error)
    throw error
  }
}

export interface EventRegistration {
  clubName: string
  status: string
  eventId: number
  eventName: string
  registeredAt: string
  attendanceLevel: string
  date: string
  committedPoints: number
}

export const getMyEventRegistrations = async (): Promise<EventRegistration[]> => {
  try {
    const response = await axiosInstance.get(`/api/events/my-registrations`)
    const data: any = response.data
    console.log(`Fetched my event registrations:`, data)
    // Response structure: { success: true, message: "success", data: [...] }
    if (data?.data && Array.isArray(data.data)) return data.data
    if (Array.isArray(data)) return data
    return []
  } catch (error) {
    console.error(`Error fetching my event registrations:`, error)
    throw error
  }
}

export interface EventCheckinPayload {
  eventJwtToken: string
  level: string
}

export const eventCheckin = async (eventJwtToken: string, level: string = "NONE") => {
  try {
    const payload: EventCheckinPayload = {
      eventJwtToken,
      level
    }
    const response = await axiosInstance.post(`/api/events/checkin`, payload)
    const data: any = response.data
    console.log(`Event check-in response:`, data)
    // Response structure: { success: true, message: "Check-in success for event co club", data: null }
    return data
  } catch (error) {
    console.error(`Error checking in to event:`, error)
    throw error
  }
}

export interface EventSummary {
  refundedCount: number
  registrationsCount: number
  checkedInCount: number
  eventName: string
  totalCommitPoints: number
}

export const getEventSummary = async (eventId: string | number): Promise<EventSummary> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/summary`)
    const data: any = response.data
    console.log(`Fetched event summary for event ${eventId}:`, data)
    // Response structure: { success: true, message: "success", data: {...summary} }
    if (data?.data) return data.data
    return data
  } catch (error) {
    console.error(`Error fetching event summary for event ${eventId}:`, error)
    throw error
  }
}

export const endEvent = async (eventId: string | number) => {
  try {
    const response = await axiosInstance.put(`/api/events/end`, { eventId })
    const data: any = response.data
    console.log(`Ended event ${eventId}:`, data)
    // Response structure: { success: true, message: "Event completed. Total reward 0 pts: leftover returned", data: "null" }
    return data
  } catch (error) {
    console.error(`Error ending event ${eventId}:`, error)
    throw error
  }
}

export const completeEvent = async (eventId: string | number) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/complete`)
    const data: any = response.data
    console.log(`Completed event ${eventId}:`, data)
    // Response structure: { success: true, message: "string", data: "string" }
    return data
  } catch (error) {
    console.error(`Error completing event ${eventId}:`, error)
    throw error
  }
}

/**
 * GET /api/events/{eventId}/attendance/qr
 * Generate QR code with phase parameter
 * @param eventId - Event ID
 * @param phase - Phase of the event (START, MID, END)
 * @returns { phase: string, token: string, expiresIn: number }
 */
export const eventQR = async (eventId: string | number, phase: string) => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/attendance/qr`, {
      params: { phase }
    })
    const data: any = response.data
    console.log(`Generated QR for event ${eventId} with phase ${phase}:`, data)
    // Response structure: { success: true, message: "success", data: { phase: "START", token: "string", expiresIn: 120 } }
    return data.data as { phase: string; token: string; expiresIn: number }
  } catch (error) {
    console.error(`Error generating QR for event ${eventId}:`, error)
    throw error
  }
}

/**
 * POST /api/events/{eventId}/settle
 * Settle a completed event
 * @param eventId - Event ID
 * @returns { success: boolean, message: string, data: string }
 */
export const eventSettle = async (eventId: string | number) => {
  try {
    const response = await axiosInstance.post(`/api/events/${eventId}/settle`)
    const data: any = response.data
    console.log(`Settled event ${eventId}:`, data)
    // Response structure: { success: true, message: "string", data: "string" }
    return data
  } catch (error) {
    console.error(`Error settling event ${eventId}:`, error)
    throw error
  }
}

/**
 * GET /api/events/settled
 * Get all settled events
 * @returns Array of settled events
 */
export const getEventSettle = async () => {
  try {
    const response = await axiosInstance.get(`/api/events/settled`)
    const data: any = response.data
    console.log(`Fetched settled events:`, data)
    // Response structure: { success: true, message: "success", data: [...] }
    return data.data as Array<{
      id: number
      name: string
      description: string
      type: string
      date: string
      startTime: string
      endTime: string
      status: string
      checkInCode: string
      budgetPoints: number
      locationName: string
      maxCheckInCount: number
      currentCheckInCount: number | null
      hostClub: {
        id: number
        name: string
        coHostStatus: string
      }
      coHostedClubs: Array<{
        id: number
        name: string
        coHostStatus: string
      }>
    }>
  } catch (error) {
    console.error(`Error fetching settled events:`, error)
    throw error
  }
}