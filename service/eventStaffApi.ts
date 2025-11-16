import axiosInstance from "@/lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Event Staff type
 */
export interface EventStaff {
  id: number;
  eventId: number;
  eventName: string;
  membershipId: number;
  memberName: string;
  duty: string;
  state: "ACTIVE" | "INACTIVE";
  assignedAt: string;
  unassignedAt: string | null;
}

/**
 * Staff Evaluation type
 */
export interface StaffEvaluation {
  id: number;
  eventStaffId: number;
  membershipId: number;
  eventId: number;
  performance: "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";
  note: string;
  createdAt: string;
}

/**
 * Staff Evaluation Request type
 */
export interface EvaluateStaffRequest {
  membershipId: number;
  eventId: number;
  performance: "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";
  note: string;
}

/**
 * Lấy danh sách nhân sự (staff) của sự kiện
 * GET /api/events/{id}/staffs
 */
export async function getEventStaff(
  eventId: number | string
): Promise<EventStaff[]> {
  const res = await axiosInstance.get<ApiResponse<EventStaff[]>>(
    `/api/events/${eventId}/staffs`
  );
  return res.data.data;
}

/**
 * Gán nhân sự (staff) cho sự kiện
 * POST /api/events/{id}/staffs?membershipId={membershipId}&duty={duty}
 */
export async function postEventStaff(
  eventId: number | string,
  membershipId: number | string,
  duty: string
): Promise<EventStaff> {
  const res = await axiosInstance.post<ApiResponse<EventStaff>>(
    `/api/events/${eventId}/staffs`,
    null,
    {
      params: {
        membershipId,
        duty,
      },
    }
  );
  return res.data.data;
}

/**
 * Đánh giá hiệu suất làm việc của staff sau sự kiện
 * POST /api/events/{id}/staff/evaluate
 */
export async function evaluateEventStaff(
  eventId: number | string,
  request: EvaluateStaffRequest
): Promise<StaffEvaluation> {
  const res = await axiosInstance.post<ApiResponse<StaffEvaluation>>(
    `/api/events/${eventId}/staff/evaluate`,
    request
  );
  return res.data.data;
}

/**
 * Lấy danh sách đánh giá staff của sự kiện
 * GET /api/events/{eventId}/staff/evaluates
 */
export async function getEvaluateEventStaff(
  eventId: number | string
): Promise<StaffEvaluation[]> {
  const res = await axiosInstance.get<ApiResponse<StaffEvaluation[]>>(
    `/api/events/${eventId}/staff/evaluates`
  );
  return res.data.data;
}

/**
 * Lấy danh sách staff được đánh giá tốt nhất trong sự kiện
 * GET /api/events/{eventId}/staff/evaluations/top
 */
export async function getTopEvaluatedStaff(
  eventId: number | string
): Promise<StaffEvaluation[]> {
  const res = await axiosInstance.get<ApiResponse<StaffEvaluation[]>>(
    `/api/events/${eventId}/staff/evaluations/top`
  );
  return res.data.data;
}

export default {
  getEventStaff,
  postEventStaff,
  evaluateEventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
};
