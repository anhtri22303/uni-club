// file: attendanceApi.ts
import axiosInstance from "@/lib/axiosInstance";

// --- Các hàm API điểm danh chung (Bạn đã có) ---
export const fetchAttendanceByDate = async (date: string) => {
  const response = await axiosInstance.get(`/api/attendance?date=${date}`);
  return response.data;
};

export const saveAttendanceRecords = async (records: any[]) => {
  const response = await axiosInstance.post(`/api/attendance`, records);
  return response.data;
};

// --- Các hàm API điểm danh CLB (Mới từ Swagger) ---
export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}
export interface CreateSessionBody {
  date: string; // "YYYY-MM-DD"
  startTime: TimeObject;
  endTime: TimeObject;
  note: string;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";

export interface MarkBulkRecord {
  membershipId: number;
  status: AttendanceStatus; // "PRESENT", "LATE", v.v.
  note: string;
}
export interface MarkBulkBody {
  records: MarkBulkRecord[];
}
export const createClubAttendanceSession = async (
  clubId: number,
  sessionData: CreateSessionBody
) => {
  const response = await axiosInstance.post(
    `/api/club-attendance/${clubId}/create-session`,
    sessionData // Gửi dữ liệu qua request body
  );
  return response.data;
};

export const fetchTodayClubAttendance = async (clubId: number) => {
  const response = await axiosInstance.get(
    `/api/club-attendance/${clubId}/today`
  );
  return response.data;
};

export interface MarkClubAttendanceParams {
  sessionId: number; // (path) ID của buổi học/sinh hoạt
  membershipId: number; // (query) ID của thành viên trong CLB
  status: AttendanceStatus; // (query) Trạng thái điểm danh
  note?: string; // (query) Ghi chú (không bắt buộc)
}

export const markClubAttendance = async (params: MarkClubAttendanceParams) => {
  const { sessionId, ...queryParams } = params;

  // Dữ liệu (membershipId, status, note) được gửi dưới dạng query params
  const response = await axiosInstance.put(
    `/api/club-attendance/${sessionId}/mark`,
    null, // Không có body data
    { params: queryParams } // Gửi dữ liệu qua query params
  );
  return response.data;
};

export interface MarkAllClubAttendanceParams {
  sessionId: number; // (path) ID của buổi học/sinh hoạt
  status: AttendanceStatus; // (query) Trạng thái áp dụng cho tất cả
}

export const markAllClubAttendance = async (
  params: MarkAllClubAttendanceParams
) => {
  const { sessionId, status } = params;

  // Dữ liệu (status) được gửi dưới dạng query params
  const response = await axiosInstance.put(
    `/api/club-attendance/${sessionId}/mark-all`,
    null, // Không có body data
    { params: { status } } // Gửi status qua query params
  );
  return response.data;
};

export interface FetchClubAttendanceHistoryParams {
  clubId: number; // (path) ID của câu lạc bộ
  date: string; // (query) Ngày cần tra cứu (ví dụ: "YYYY-MM-DD")
}

/**
 * Tương ứng với: GET /api/club-attendance/{clubId}/history
 * Lấy lịch sử điểm danh của một câu lạc bộ theo ngày.
 *
 * @param params Dữ liệu bao gồm clubId và date
 */
export const fetchClubAttendanceHistory = async (
  params: FetchClubAttendanceHistoryParams
) => {
  const { clubId, date } = params;

  // Gửi 'date' qua query params
  const response = await axiosInstance.get(
    `/api/club-attendance/${clubId}/history`,
    { params: { date } } // Thêm 'date' làm query parameter
  );
  return response.data;
};

export const markAttendanceBulk = async (sessionId: number, data: MarkBulkBody) => {
  const response = await axiosInstance.put(
    `/api/club-attendance/${sessionId}/mark-bulk`,
    data // Gửi body
  );
  return response.data;
};

/**
 * Tương ứng với: GET /api/club-attendance/member/{membershipId}/history
 * Lấy toàn bộ lịch sử điểm danh của một thành viên (membershipId) trong CLB.
 *
 * @param membershipId ID thành viên của CLB (membershipId)
 */
export const fetchMemberAttendanceHistory = async (membershipId: number) => {
  const response = await axiosInstance.get(
    `/api/club-attendance/member/${membershipId}/history`
  );
  return response.data;
};