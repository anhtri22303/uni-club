import axiosInstance from "@/lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Interfaces (Giữ nguyên) ---

export type ApiClub = {
  id: number;
  name: string;
};

export type ApiMembership = {
  membershipId: number;
  userId: number;
  clubId: number;
  clubRole: "LEADER" | "MEMBER" | string;
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

// --- API Functions (Đã cập nhật & Bổ sung) ---

// === GET Functions ===

/**
 * Lấy danh sách các club CỦA TÔI (student đang đăng nhập)
 * (GET /api/users/me/clubs)
 */
export async function getMyClubs(): Promise<ApiMembership[]> {
  // Endpoint cũ của bạn là "/api/memberships/my-club" (sai)
  const res = await axiosInstance.get<ApiResponse<ApiMembership[]>>(
    "/api/users/me/clubs"
  );
  const body: any = res.data;
  console.log("My clubs Members:", body);
  return body?.data || [];
}

/**
 * Lấy danh sách TẤT CẢ thành viên của 1 club
 * (GET /api/clubs/{clubId}/members)
 * (Hàm này đã đúng)
 */
export async function getMembersByClubId(
  clubId: number
): Promise<ApiMembership[]> {
  const res = await axiosInstance.get(`/api/clubs/${clubId}/members`);
  const body: any = res.data;

  if (!body?.success) {
    throw new Error(body?.message || "Failed to fetch club members");
  }
  return body.data || [];
}

/**
 * ❗️ MỚI: Lấy danh sách thành viên đang chờ duyệt của 1 club
 * (GET /api/clubs/{clubId}/members/pending)
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
 * ❗️ MỚI: Lấy danh sách ban chủ nhiệm (staff) của 1 club
 * (GET /api/clubs/{clubId}/members/staff)
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
 * ❗️ MỚI: Lấy danh sách thành viên (lọc theo tên leader)
 * (GET /api/members)
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
 * ❗️ MỚI: Student xin tham gia 1 club
 * (POST /api/clubs/{clubId}/join)
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
 * ❗️ MỚI: Leader duyệt 1 thành viên
 * (PATCH /api/memberships/{membershipId}/approve)
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
 * ❗️ MỚI: Leader từ chối 1 thành viên
 * (PATCH /api/memberships/{membershipId}/reject)
 */
export async function rejectMembership(
  membershipId: number | string,
  reason: string
): Promise<ApiMembership> {
  const res = await axiosInstance.patch<ApiResponse<ApiMembership>>(
    `/api/memberships/${membershipId}/reject`,
    null, // Không có body
    {
      params: { reason }, // Gửi reason qua query param
    }
  );
  return res.data.data;
}

/**
 * ❗️ MỚI: Leader kick 1 thành viên
 * (PATCH /api/memberships/{membershipId}/kick)
 */
export async function kickMember(
  membershipId: number | string
): Promise<string> {
  const res = await axiosInstance.patch<ApiResponse<string>>(
    `/api/memberships/${membershipId}/kick`
  );
  return res.data.data; // Trả về message
}

/**
 * ❗️ MỚI: Leader cập nhật vai trò (role) của thành viên
 * (PUT /api/memberships/{membershipId}/role)
 */
export async function updateMemberRole(
  membershipId: number | string,
  newRole: string
): Promise<ApiMembership> {
  const res = await axiosInstance.put<ApiResponse<ApiMembership>>(
    `/api/memberships/${membershipId}/role`,
    null, // Không có body
    {
      params: { newRole }, // Gửi newRole qua query param
    }
  );
  return res.data.data;
}

/**
 * Xóa một membership (ví dụ: student tự rời club)
 * (DELETE /api/memberships/{membershipId})
 * (Hàm này đã đúng)
 */
export async function deleteMember(
  membershipId: number
): Promise<{ message: string }> {
  const res = await axiosInstance.delete(`/api/memberships/${membershipId}`);
  const body: any = res.data;

  if (!body?.success) {
    throw new Error(body?.message || "Failed to remove member");
  }
  return body.data || { message: "Member removed successfully" };
}

// Cập nhật default export
export default {
  getMyClubs, // ❗️ Đã đổi tên từ getClubMembers
  getMembersByClubId,
  deleteMember,
  joinClub, // ❗️ Mới
  approveMembership, // ❗️ Mới
  rejectMembership, // ❗️ Mới
  kickMember, // ❗️ Mới
  updateMemberRole, // ❗️ Mới
  getPendingMembers, // ❗️ Mới
  getClubStaff, // ❗️ Mới
  getMembersByLeaderName, // ❗️ Mới
};