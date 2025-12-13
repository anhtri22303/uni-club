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
  state: "ACTIVE" | "INACTIVE" | "REMOVED";
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
 * Lấy danh sách staff sau khi sự kiện kết thúc
 * Chỉ dùng khi event đã COMPLETED.
 * Tự động chuyển staff ACTIVE → EXPIRED, sau đó trả về danh sách EXPIRED.
 * GET /api/events/{eventId}/staffs/completed
 */
export async function getEventStaffCompleted(
  eventId: number | string
): Promise<EventStaff[]> {
  const res = await axiosInstance.get<ApiResponse<EventStaff[]>>(
    `/api/events/${eventId}/staffs/completed`
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
 * Xóa nhân sự (staff) khỏi sự kiện
 * DELETE /api/events/{id}/staffs/{staffId}
 */
export async function deleteEventStaff(
  eventId: number | string,
  staffId: number | string
): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/events/${eventId}/staffs/${staffId}`
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
    `/api/events/${eventId}/staff/evaluations`
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

/**
 * My Staff Event - Staff Event của tôi
 */
export interface MyStaffEvent {
  eventId: number;
  eventName: string;
  clubId: number;
  clubName: string;
  duty: string;
  state: "ACTIVE" | "INACTIVE" | "REMOVED";
}

/**
 * Staff History Order - Lịch sử phê duyệt đơn hàng của staff
 */
export interface StaffHistoryOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  completedAt: string;
  productType: string;
  clubId: number;
  eventId: number;
  clubName: string;
  memberName: string;
  reasonRefund: string;
  errorImages: string[];
}

/**
 * Lấy danh sách event mà user hiện tại là staff
 * GET /api/events/my/staff
 */
export async function getMyStaff(): Promise<MyStaffEvent[]> {
  const res = await axiosInstance.get<ApiResponse<MyStaffEvent[]>>(
    "/api/events/my/staff"
  );
  return res.data.data;
}

/**
 * Lấy lịch sử phê duyệt đơn hàng của staff
 * GET /api/redeem/my-approvals
 */
export async function getStaffHistory(): Promise<StaffHistoryOrder[]> {
  const res = await axiosInstance.get<ApiResponse<{ content: StaffHistoryOrder[] }>>(
    "/api/redeem/my-approvals"
  );
  return res.data.data.content;
}

export default {
  getEventStaff,
  getEventStaffCompleted,
  postEventStaff,
  deleteEventStaff,
  evaluateEventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
  getMyStaff,
  getStaffHistory,
};
