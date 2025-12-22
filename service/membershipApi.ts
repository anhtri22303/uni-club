import axiosInstance from "@/lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Interfaces ---

export type ApiClub = {
  id: number;
  name: string;
};

export type ApiMembership = {
  membershipId: number;
  userId: number;
  clubId: number;
  clubRole: "LEADER" | "MEMBER" | "VICE_LEADER" | string;
  state: "ACTIVE" | "PENDING" | "REJECTED" | string;
  staff: boolean;
  joinedDate?: string;
  endDate?: string;
  fullName: string;
  studentCode: string;
  clubName: string;
  email?: string;
  avatarUrl?: string;
  major?: string;
};

// Interface cho Request Body có reason
interface ReasonBody {
  reason: string;
}

// --- API Functions ---

// === GET Functions ===

/**
 * Lấy danh sách các club CỦA TÔI
 */
export async function getMyClubs(): Promise<ApiMembership[]> {
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    "/api/users/me/clubs"
  );
  return res.data.data || [];
}

/**
 * Lấy danh sách TẤT CẢ thành viên của 1 club
 */
export async function getMembersByClubId(
  clubId: number
): Promise<ApiMembership[]> {
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    `/api/clubs/${clubId}/members`
  );
  
  return res.data.data || [];
}

/**
 * Lấy danh sách thành viên đang chờ duyệt
 */
export async function getPendingMembers(
  clubId: number | string
): Promise<ApiMembership[]> {
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    `/api/clubs/${clubId}/members/pending`
  );
  return res.data.data || [];
}

/**
 * Lấy danh sách ban chủ nhiệm (staff)
 */
export async function getClubStaff(
  clubId: number | string
): Promise<ApiMembership[]> {
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    `/api/clubs/${clubId}/members/staff`
  );
  return res.data.data || [];
}

/**
 * Tìm kiếm thành viên theo tên leader (hoặc filter khác)
 */
export async function getMembersByLeaderName(
  leaderName: string
): Promise<ApiMembership[]> {
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    `/api/members`,
    {
      params: { leaderName },
    }
  );
  return res.data.data || [];
}

// === POST/PUT/PATCH/DELETE Functions ===

/**
 * Student xin tham gia 1 club
 */
export async function joinClub(
  clubId: number | string
): Promise<ApiMembership> {
  const res = await axiosInstance.post<ApiResponse<ApiMembership>>(
    `/api/clubs/${clubId}/join`
  );
  return res.data.data;
}

/**
 * Leader duyệt 1 thành viên
 */
export async function approveMembership(
  membershipId: number | string
): Promise<ApiMembership> {
  const res = await axiosInstance.patch<ApiResponse<ApiMembership>>(
    `/api/memberships/${membershipId}/approve`
  );
  return res.data.data;
}

/**
 * Leader từ chối 1 thành viên (Pending -> Rejected)
 * SWAGGER: Parameter 'reason' nằm ở Query String
 */
export async function rejectMembership(
  membershipId: number | string,
  reason: string
): Promise<ApiMembership> {
  const res = await axiosInstance.patch<ApiResponse<ApiMembership>>(
    `/api/memberships/${membershipId}/reject`,
    null, // Body null
    {
      params: { reason }, // Gửi reason qua query param đúng như ảnh
    }
  );
  return res.data.data;
}

/**
 * ❗️ CẬP NHẬT: Leader kick 1 thành viên (Ngay lập tức)
 * SWAGGER: Parameter 'reason' nằm ở Request Body
 */
export async function kickMember(
  membershipId: number | string,
  reason: string
): Promise<string> {
  const res = await axiosInstance.patch<ApiResponse<string>>(
    `/api/memberships/${membershipId}/kick`,
    { reason } // Body chứa reason đúng như ảnh Swagger
  );
  return res.data.data;
}

/**
 * ❗️ MỚI: Leader xoá hoặc huỷ kích hoạt thành viên (Active -> Removed/Inactive)
 * SWAGGER: PATCH /api/memberships/{membershipId}/remove
 * Body: { reason: string }
 */
export async function removeMember(
  membershipId: number | string,
  reason: string
): Promise<any> {
  const res = await axiosInstance.patch<ApiResponse<any>>(
    `/api/memberships/${membershipId}/remove`,
    { reason }
  );
  return res.data.data;
}

/**
 * Leader cập nhật vai trò (role) của thành viên
 */
export async function updateMemberRole(
  membershipId: number | string,
  newRole: string
): Promise<ApiMembership> {
  const res = await axiosInstance.put<ApiResponse<ApiMembership>>(
    `/api/memberships/${membershipId}/role`,
    null,
    {
      params: { newRole },
    }
  );
  return res.data.data;
}

/**
 * Student gửi yêu cầu rời club
 */
export async function postLeaveReq(
  clubId: number | string,
  reason: string
): Promise<string> {
  const res = await axiosInstance.post<ApiResponse<string>>(
    `/api/clubs/${clubId}/leave-request`,
    { reason }
  );
  return res.data.data;
}

// Interface cho Leave Request
export interface LeaveRequest {
  requestId: number;
  membershipId: number;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  processedAt: string | null;
}

/**
 * Leader lấy danh sách yêu cầu rời club
 */
export async function getLeaveReq(
  clubId: number | string
): Promise<LeaveRequest[]> {
  const res = await axiosInstance.get<ApiResponse<LeaveRequest[]>>(
    `/api/clubs/${clubId}/leave-requests`
  );
  return res.data.data || [];
}

/**
 * Leader approve/reject yêu cầu rời club
 */
export async function putLeaveReq(
  requestId: number | string,
  action: "APPROVED" | "REJECTED"
): Promise<string> {
  const res = await axiosInstance.put<ApiResponse<string>>(
    `/api/clubs/leave-request/${requestId}`,
    null,
    {
      params: { action },
    }
  );
  return res.data.data;
}

/**
 * Xóa cứng một membership (DELETE method)
 * (Giữ lại hàm này nếu hệ thống vẫn dùng DELETE cho trường hợp khác, 
 * còn Leader quản lý thành viên thì nên dùng removeMember hoặc kickMember ở trên)
 */
export async function deleteMember(
  membershipId: number
): Promise<{ message: string }> {
  const res = await axiosInstance.delete<ApiResponse<any>>(
    `/api/memberships/${membershipId}`
  );
  return res.data.data || { message: "Member deleted successfully" };
}

// Cập nhật default export
export default {
  getMyClubs,
  getMembersByClubId,
  deleteMember,
  joinClub,
  approveMembership,
  rejectMembership,
  kickMember,   // Đã update body
  removeMember, // Mới thêm
  updateMemberRole,
  getPendingMembers,
  getClubStaff,
  getMembersByLeaderName,
  postLeaveReq,
  getLeaveReq,
  putLeaveReq,
};