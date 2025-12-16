import axiosInstance from "@/lib/axiosInstance"

// Time object format for API requests/responses
export interface TimeObject {
  hour: number
  minute: number
  second: number
  nano: number
}

// Event day structure for multi-day events
export interface EventDay {
  id: number
  date: string // Format: YYYY-MM-DD
  startTime: string // Format: HH:MM
  endTime: string // Format: HH:MM
}

export interface Event {
  id: number
  name: string
  description: string
  type: "PUBLIC" | "PRIVATE" | string
  // Multi-day event fields (NEW)
  startDate?: string // Format: YYYY-MM-DD
  endDate?: string // Format: YYYY-MM-DD
  days?: EventDay[]
  // Legacy single-day fields (for backward compatibility)
  date?: string
  startTime?: TimeObject | string | null
  endTime?: TimeObject | string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "ONGOING" | "PENDING_COCLUB" | "PENDING_UNISTAFF" | "WAITING" | string
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
  // Legacy fields
  clubId?: number
  clubName?: string
  time?: string
  locationId?: number
}

// Day input for creating multi-day events
export interface CreateEventDayInput {
  date: string // Format: YYYY-MM-DD
  startTime: string // Format: HH:MM
  endTime: string // Format: HH:MM
}

export interface CreateEventPayload {
  hostClubId: number
  coHostClubIds?: number[]
  name: string
  description: string
  type: "PUBLIC" | "PRIVATE" | "SPECIAL"
  days: CreateEventDayInput[] // Array of days with TimeObject format
  registrationDeadline: string // Format: YYYY-MM-DD
  locationId: number
  maxCheckInCount: number
  commitPointCost: number
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

// Helper function to check if event is multi-day
export const isMultiDayEvent = (event: Event): boolean => {
  return !!(event.days && event.days.length > 0)
}

// Helper function to get event date range
export const getEventDateRange = (event: Event): { start: string; end: string } => {
  if (isMultiDayEvent(event) && event.startDate && event.endDate) {
    return { start: event.startDate, end: event.endDate }
  }
  // Fallback to legacy single date
  const date = event.date || new Date().toISOString().split('T')[0]
  return { start: date, end: date }
}

// Helper function to format date range display
export const formatEventDateRange = (event: Event, locale: string = 'en-US'): string => {
  const { start, end } = getEventDateRange(event)
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  if (start === end) {
    return startDate.toLocaleDateString(locale, options)
  }
  
  return `${startDate.toLocaleDateString(locale, options)} - ${endDate.toLocaleDateString(locale, options)}`
}

// Helper function to get event duration in days
export const getEventDurationDays = (event: Event): number => {
  if (isMultiDayEvent(event) && event.days) {
    return event.days.length
  }
  return 1
}

// Helper function to get first day start time
export const getEventStartTime = (event: Event): string => {
  if (isMultiDayEvent(event) && event.days && event.days.length > 0) {
    return event.days[0].startTime
  }
  // Legacy fallback
  return timeObjectToString(event.startTime || null)
}

// Helper function to get last day end time
export const getEventEndTime = (event: Event): string => {
  if (isMultiDayEvent(event) && event.days && event.days.length > 0) {
    return event.days[event.days.length - 1].endTime
  }
  // Legacy fallback
  return timeObjectToString(event.endTime || null)
}

// Helper function to check if event is currently active
export const isEventCurrentlyActive = (event: Event): boolean => {
  const now = new Date()
  
  if (isMultiDayEvent(event) && event.days) {
    // Check each day to see if any is currently active
    for (const day of event.days) {
      const [startHour, startMinute] = day.startTime.split(':').map(Number)
      const [endHour, endMinute] = day.endTime.split(':').map(Number)
      const [year, month, dayNum] = day.date.split('-').map(Number)
      
      const dayStart = new Date(year, month - 1, dayNum, startHour, startMinute)
      const dayEnd = new Date(year, month - 1, dayNum, endHour, endMinute)
      
      if (now >= dayStart && now <= dayEnd) {
        return true
      }
    }
    return false
  }
  
  // Legacy single-day check
  if (!event.date || !event.endTime) return false
  
  try {
    const eventDate = new Date(event.date)
    const endTimeStr = timeObjectToString(event.endTime)
    const [hours, minutes] = endTimeStr.split(':').map(Number)
    const eventEndDateTime = new Date(eventDate)
    eventEndDateTime.setHours(hours, minutes, 0, 0)
    
    return now <= eventEndDateTime
  } catch (error) {
    return false
  }
}

// Helper function to check if event has expired
export const isEventExpired = (event: Event): boolean => {
  if (event.status === 'COMPLETED') return true
  
  const now = new Date()
  
  if (isMultiDayEvent(event) && event.days && event.days.length > 0) {
    const lastDay = event.days[event.days.length - 1]
    const [endHour, endMinute] = lastDay.endTime.split(':').map(Number)
    const [year, month, dayNum] = lastDay.date.split('-').map(Number)
    const eventEnd = new Date(year, month - 1, dayNum, endHour, endMinute)
    
    return now > eventEnd
  }
  
  // Legacy single-day check
  if (!event.date || !event.endTime) return false
  
  try {
    const eventDate = new Date(event.date)
    const endTimeStr = timeObjectToString(event.endTime)
    const [hours, minutes] = endTimeStr.split(':').map(Number)
    const eventEndDateTime = new Date(eventDate)
    eventEndDateTime.setHours(hours, minutes, 0, 0)
    
    return now > eventEndDateTime
  } catch (error) {
    return false
  }
}

export const fetchEvent = async ({ page = 0, size = 70, sort = "name" } = {}): Promise<Event[]> => {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack;

  try {
    const response = await axiosInstance.get("api/events", {
      params: {
        page,
        size,
        sort,
      },
    });
    const data: any = response.data;

    // Log first event to check structure
    // if (data?.content?.[0]) {
    // }

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
    console.error(`  fetchEvent error at ${new Date().toISOString()}:`, error);
    throw error;
  }
}

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  try {
    const response = await axiosInstance.post("api/events", payload)
    const data: any = response.data
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
    // Response structure: { success: true, message: "success", data: { id, name, description, type, date, startTime, endTime, status, locationName, checkInCode, maxCheckInCount, currentCheckInCount, hostClub: { id, name } } }
    // Always return the data object when present
    if (resData && resData.data) return resData.data
    return resData
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error)
    throw error
  }
}

export const putEventStatus = async (id: string | number, approvedBudgetPoints: number): Promise<Event> => {
  try {
    // Cập nhật endpoint và payload theo Swagger
    const response = await axiosInstance.put(
      `api/events/${id}/approve-budget`,
      { approvedBudgetPoints }
    )

    const data: any = response.data

    // Response structure: { success: true, message: "success", data: {...event} }
    if (data && data.data) return data.data
    return data
  } catch (error) {
    console.error(`Error approving budget for event ${id}:`, error)
    throw error
  }
}

export const getEventByCode = async (code: string): Promise<Event> => {
  // call the correct endpoint: /api/events/code/{code}
  try {
    const response = await axiosInstance.get(`/api/events/code/${encodeURIComponent(code)}`)
    const resData: any = response.data
    // console.debug(`Fetched event by code ${code}:`, resData)
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

// export const getEventByClubId = async (clubId: string | number): Promise<Event[]> => {
//   try {
//     const response = await axiosInstance.get(`/api/events/club/${clubId}`)
//     const resData: any = response.data

//     // If response is direct array of events
//     if (Array.isArray(resData)) return resData

//     // If response has wrapper structure like { success, data, message }
//     if (resData?.data && Array.isArray(resData.data)) return resData.data

//     // If response has content property (pagination)
//     if (resData?.content && Array.isArray(resData.content)) return resData.content

//     // Fallback to empty array if no events found
//     return []
//   } catch (error) {
//     console.error(`Error fetching events for club ${clubId}:`, error)
//     throw error
//   }
// }

// export const getEventCoHost = async (clubId: string | number): Promise<Event[]> => {
//   try {
//     const response = await axiosInstance.get(`/api/events/club/${clubId}/cohost`)
//     const resData: any = response.data

//     // If response is direct array of events
//     if (Array.isArray(resData)) return resData

//     // If response has wrapper structure like { success, data, message }
//     if (resData?.data && Array.isArray(resData.data)) return resData.data

//     // If response has content property (pagination)
//     if (resData?.content && Array.isArray(resData.content)) return resData.content

//     // Fallback to empty array if no events found
//     return []
//   } catch (error) {
//     console.error(`Error fetching co-host events for club ${clubId}:`, error)
//     throw error
//   }
// }

export const getEventByClubId = async (clubId: string | number): Promise<Event[]> => {
  try {
    // API: /api/events/club/{clubId}
    const response = await axiosInstance.get(`/api/events/club/${clubId}`)
    const resData: any = response.data
    console.log(`getEventByClubId response for club ${clubId}:`, resData)
    
    // KIỂM TRA CẤU TRÚC {success, message, data: {events: [...]}}
    if (resData?.data?.events && Array.isArray(resData.data.events)) {
      return resData.data.events
    }

    // Theo Swagger, response trả về trực tiếp mảng: [...]
    if (Array.isArray(resData)) {
      return resData
    }

    // Fallback logic cũ (phòng hờ môi trường khác nhau)
    if (resData?.data && Array.isArray(resData.data)) return resData.data
    if (resData?.content && Array.isArray(resData.content)) return resData.content

    console.warn(` Unexpected response structure for club ${clubId}:`, resData)
    return []
  } catch (error) {
    console.error(`Error fetching events for club ${clubId}:`, error)
    throw error
  }
}

export const getEventCoHost = async (clubId: string | number): Promise<Event[]> => {
  try {
    // API: /api/events/club/{clubId}/cohost
    const response = await axiosInstance.get(`/api/events/club/${clubId}/cohost`)
    const resData: any = response.data

    // Theo Swagger, response trả về trực tiếp mảng: [...]
    if (Array.isArray(resData)) {
      return resData
    }

    // Fallback logic cũ
    if (resData?.data && Array.isArray(resData.data)) return resData.data
    if (resData?.content && Array.isArray(resData.content)) return resData.content

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
    // Response structure: { success: true, message: "success", data: [...] }
    if (data?.data && Array.isArray(data.data)) return data.data
    if (Array.isArray(data)) return data
    return []
  } catch (error) {
    console.error(`Error fetching my event registrations:`, error)
    throw error
  }
}

/**
 * GET /api/events/my
 * Get all events that the current user has registered for
 * @returns Array of Event objects that the user has registered for
 */
export const getMyEvents = async (): Promise<Event[]> => {
  try {
    const response = await axiosInstance.get("api/events/my")
    const data: any = response.data

    console.log("getMyEvents:", data)
    // Response structure: { success: true, message: "success", data: [...events] }
    if (data?.data && Array.isArray(data.data)) return data.data
    if (Array.isArray(data)) return data

    
    return []
  } catch (error) {
    console.error("Error fetching my events:", error)
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
    // Response structure: { success: true, message: "Check-in success for event co club", data: null }
    return data
  } catch (error) {
    console.error(`Error checking in to event:`, error)
    throw error
  }
}

export const eventCheckinPublic = async (code: string) => {
  try {
    const response = await axiosInstance.post(
      `/api/events/public/checkin`,
      null,
      { params: { code } }
    )
    const data: any = response.data
    // Response structure: { success: true, message: "string", data: "string" }
    return data
  } catch (error) {
    console.error(`Error checking in to public event:`, error)
    throw error
  }
}

export interface EventSummary {
  refundedCount: number
  totalRegistered: number
  checkedInCount: number
  eventName: string
  totalCommitPoints: number
}

export const getEventSummary = async (eventId: string | number): Promise<EventSummary> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/summary`)
    const data: any = response.data
    console.log(`Event summary for event ${eventId}:`, data)
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

/**
 * PUT /api/events/{eventId}/extend
 * Extend event time
 * @param eventId - Event ID
 * @param payload - Extended time data
 * @returns Updated event data
 */
export interface EventTimeExtendPayload {
  newDate: string       // Format: YYYY-MM-DD
  newStartTime: string  // Format: HH:mm (e.g., 09:00)
  newEndTime: string    // Format: HH:mm (e.g., 23:59)
  reason: string        // Reason for extension
}

export const eventTimeExtend = async (eventId: string | number, payload: EventTimeExtendPayload): Promise<Event> => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}/extend`, payload)
    const data: any = response.data
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data?.data) return data.data
    return data
  } catch (error) {
    console.error(`Error extending time for event ${eventId}:`, error)
    throw error
  }
}

/**
 * PUT /api/events/{eventId}/reject
 * Từ chối sự kiện (University Staff hoặc Admin)
 * (Khớp ảnh: image_df08d6.png)
 * @param eventId - ID của sự kiện
 * @param reason - Lý do từ chối
 * @returns { success: boolean, message: string, data: string }
 */
export const rejectEvent = async (eventId: string | number, reason: string) => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}/reject`, null, {
      params: { reason }
    });
    const data: any = response.data;
    // Response: { success: true, message: "string", data: "string" }
    return data;
  } catch (error) {
    console.error(`Error rejecting event ${eventId}:`, error);
    throw error;
  }
}

/**
 * PUT /api/events/{eventId}/cancel
 * Admin/Staff hủy sự kiện đã được duyệt
 * @param eventId - ID của sự kiện
 * @param reason - Lý do hủy sự kiện
 * @returns { success: boolean, message: string, data: string }
 */
export const cancelEvent = async (eventId: string | number, reason: string) => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}/cancel`, { reason });
    const data: any = response.data;
    // Response: { success: true, message: "string", data: "string" }
    return data;
  } catch (error) {
    console.error(`Error cancelling event ${eventId}:`, error);
    throw error;
  }
}

/**
 * PUT /api/events/{eventId}/registration/cancel
 * Sinh viên hủy đăng ký sự kiện
 * @param eventId - ID của sự kiện
 * @returns { success: boolean, message: string, data: string }
 */
export const cancelEventRegistration = async (eventId: string | number) => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}/registration/cancel`);
    const data: any = response.data;
    // Response: { success: true, message: "string", data: "string" }
    return data;
  } catch (error) {
    console.error(`Error cancelling event registration ${eventId}:`, error);
    throw error;
  }
}/**
 * PUT /api/events/{eventId}/refund-product/{productId}
 * Hoàn điểm sản phẩm thuộc sự kiện
 * (Khớp ảnh: image_df0bbd.png)
 * @param eventId - ID sự kiện
 * @param productId - ID sản phẩm
 * @param userId - ID của sinh viên
 * @returns { } (200 OK với body rỗng)
 */
export const refundEventProduct = async (
  eventId: string | number,
  productId: string | number,
  userId: string | number
) => {
  try {
    const response = await axiosInstance.put(
      `/api/events/${eventId}/refund-product/${productId}`,
      null,
      {
        params: { userId }
      }
    );
    const data: any = response.data;
    // Response: 200 OK with empty body {}
    return data; // Thường trả về data rỗng
  } catch (error) {
    console.error(`Error refunding product for event ${eventId}:`, error);
    throw error;
  }
}



export interface EventFeedbackSummary {
  [key: string]: any; // Dùng 'any' để linh hoạt, có thể là 'number' nếu bạn chắc chắn
}
/**
 * GET /api/events/{eventId}/feedback/summary
 * Tổng hợp thống kê feedback của sự kiện
 * (Khớp ảnh: image_cb4e24.png)
 * @param eventId - ID của sự kiện
 * @returns {Promise<EventFeedbackSummary>} - Đối tượng thống kê
 */
export const getEventFeedbackSummary = async (eventId: string | number): Promise<EventFeedbackSummary> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/feedback/summary`);
    const data: any = response.data;

    // Response: { success: true, message: "string", data: {...} }
    if (data?.data) return data.data;

    return data; // Fallback nếu API trả về object data trực tiếp
  } catch (error) {
    console.error(`Error fetching feedback summary for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * GET /api/events/by-date
 * Lấy tất cả sự kiện theo ngày cụ thể
 * @param date - Ngày cần lấy sự kiện (format: YYYY-MM-DD)
 * @returns Array of Event objects on that date
 */
export const getEventByDate = async (date: string): Promise<Event[]> => {
  try {
    const response = await axiosInstance.get(`/api/events/by-date?date=${date}`)
    const resData: any = response.data
    
    // Response structure: { success: true, message: "success", data: [...] }
    if (resData?.success && Array.isArray(resData.data)) {
      return resData.data
    }
    
    // Fallback: if direct array
    if (Array.isArray(resData)) {
      return resData
    }
    
    // Fallback: empty array
    return []
  } catch (error) {
    console.error(`Error fetching events for date ${date}:`, error)
    throw error
  }
}

/**
 * Event attendee check-in information
 */
export interface EventAttendee {
  userId: number
  fullName: string
  email: string
  attendanceLevel: string
  checkinAt: string | null
  checkMidAt: string | null
  checkoutAt: string | null
}

/**
 * GET /api/events/{eventId}/attendees
 * Lấy danh sách sinh viên đã check-in vào sự kiện
 * @param eventId - ID của sự kiện
 * @returns Array of EventAttendee objects
 */
export const getEventCheckin = async (eventId: string | number): Promise<EventAttendee[]> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/attendees`)
    const resData: any = response.data
    
    // Response structure: Direct array of attendees
    if (Array.isArray(resData)) {
      return resData
    }
    
    // If response has wrapper structure like { success, data, message }
    if (resData?.data && Array.isArray(resData.data)) {
      return resData.data
    }
    
    // Fallback: empty array
    return []
  } catch (error) {
    console.error(`Error fetching attendees for event ${eventId}:`, error)
    throw error
  }
}

/**
 * Event registration information
 */
export interface EventRegistrationDetail {
  userId: number
  fullName: string
  email: string
  status: string
  registeredAt: string | null
  committedPoints: number
}

/**
 * GET /api/events/{eventId}/registrations
 * Lấy danh sách sinh viên đã đăng ký sự kiện
 * @param eventId - ID của sự kiện
 * @returns Array of EventRegistrationDetail objects
 */
export const getEventRegistrations = async (eventId: string | number): Promise<EventRegistrationDetail[]> => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}/registrations`)
    const resData: any = response.data
    
    // Response structure: Direct array of registrations
    if (Array.isArray(resData)) {
      return resData
    }
    
    // If response has wrapper structure like { success, data, message }
    if (resData?.data && Array.isArray(resData.data)) {
      return resData.data
    }
    
    // Fallback: empty array
    return []
  } catch (error) {
    console.error(`Error fetching registrations for event ${eventId}:`, error)
    throw error
  }
}
