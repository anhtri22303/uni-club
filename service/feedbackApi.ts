import axiosInstance from "@/lib/axiosInstance"

// Feedback interface based on API response
export interface Feedback {
  feedbackId: number
  eventId: number
  eventName: string
  clubName: string
  // Optional: present in some endpoints
  memberName?: string
  membershipId: number
  rating: number
  comment: string
  createdAt: string
  updatedAt: string | null
}

interface FeedbackApiResponse {
  success: boolean
  message: string
  data: Feedback[]
}

/**
 * Get current member's feedbacks by membershipId
 * Endpoint: /api/events/memberships/{membershipId}/feedbacks
 */
export const getMyFeedbackByMembershipId = async (
  membershipId: string | number
): Promise<Feedback[]> => {
  try {
    const response = await axiosInstance.get<FeedbackApiResponse>(
      `/api/events/memberships/${membershipId}/feedbacks`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch feedbacks for membership ${membershipId}:`, error)
    throw error
  }
}

/**
 * Get all feedback for a specific event
 * @param eventId - The ID of the event
 * @returns Promise with array of feedback
 */
export const getFeedbackByEventId = async (eventId: string | number): Promise<Feedback[]> => {
  try {
    const response = await axiosInstance.get<FeedbackApiResponse>(
      `/api/events/${eventId}/feedback`
    )
    console.log("Feedback Event:", response.data);
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch feedback for event ${eventId}:`, error)
    throw error
  }
}

/**
 * Get all feedback for a specific club
 * @param clubId - The ID of the club
 * @returns Promise with array of feedback
 */
export const getFeedbackByClubId = async (clubId: string | number): Promise<Feedback[]> => {
  try {
    const response = await axiosInstance.get<FeedbackApiResponse>(
      `/api/events/clubs/${clubId}/feedbacks`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch feedback for club ${clubId}:`, error)
    throw error
  }
}

// Request interface for posting feedback
export interface PostFeedbackRequest {
  rating: number // 1-5
  comment: string
}

interface PostFeedbackApiResponse {
  success: boolean
  message: string
  data: Feedback
}

/**
 * Post feedback for a specific event
 * @param eventId - The ID of the event
 * @param feedbackData - The feedback data (rating and comment)
 * @returns Promise with the created feedback
 */
export const postFeedback = async (
  eventId: string | number,
  feedbackData: PostFeedbackRequest
): Promise<Feedback> => {
  try {
    const response = await axiosInstance.post<PostFeedbackApiResponse>(
      `/api/events/${eventId}/feedback`,
      feedbackData
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to post feedback for event ${eventId}:`, error)
    throw error
  }
}

/**
 * Get all feedbacks for the currently authenticated student
 * Endpoint: /api/events/my-feedbacks
 */
export const getMyFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const response = await axiosInstance.get<FeedbackApiResponse>(
      "/api/events/my-feedbacks"
    )
    return response.data.data
  } catch (error) {
    console.error("Failed to fetch my feedbacks:", error)
    throw error
  }
}

/**
 * Update/edit feedback for a specific feedback
 * Endpoint: PUT /api/events/feedback/{feedbackId}
 * @param feedbackId - The ID of the feedback to update
 * @param feedbackData - The updated feedback data (rating and comment)
 * @returns Promise with the updated feedback
 */
export const putFeedback = async (
  feedbackId: string | number,
  feedbackData: PostFeedbackRequest
): Promise<Feedback> => {
  try {
    const response = await axiosInstance.put<PostFeedbackApiResponse>(
      `/api/events/feedback/${feedbackId}`,
      feedbackData
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to update feedback ${feedbackId}:`, error)
    throw error
  }
}
