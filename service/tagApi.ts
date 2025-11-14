import axiosInstance from "../lib/axiosInstance";

// --- Standard API Response Wrapper ---
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Interface for Tag ---
export interface Tag {
  tagId: number;
  name: string;
  description: string; // Đã thêm
  core: boolean;       // Đã thêm
}

// --- Interface for Tag Update Payload ---
// DTO (Data Transfer Object) cho body của request PUT /api/tags/{id}
// Dựa trên mô tả: "Cho phép chỉnh sửa tên và mô tả của tag"
export interface UpdateTagDto {
  name: string;
  description: string;
  core: boolean; // <-- ĐÃ THÊM
}

// --- API Functions ---

/**
 * Lấy danh sách TẤT CẢ các tag (GET /api/tags)
 */
export async function getTags(): Promise<Tag[]> {
  const res = await axiosInstance.get<ApiResponse<Tag[]>>(
    "/api/tags"
  );
  return res.data.data;
}

/**
 * Thêm một tag mới (POST /api/tags)
 */
export async function addTag(name: string): Promise<Tag> {
  const res = await axiosInstance.post<ApiResponse<Tag>>(
    "/api/tags",
    null,
    { params: { name } }
  );
  return res.data.data;
}

/**
 * Cập nhật một tag (PUT /api/tags/{id})
 * (CẬP NHẬT) Hàm này giờ đã chấp nhận data với 'core'
 */
export async function updateTag(
  tagId: number | string,
  data: UpdateTagDto // DTO này đã được cập nhật
): Promise<Tag> {
  const res = await axiosInstance.put<ApiResponse<Tag>>(
    `/api/tags/${tagId}`,
    data // Gửi 'data' (name, description, core)
  );
  return res.data.data;
}
/**
 * Xóa một tag (DELETE /api/tags/{id})
 */
export async function deleteTag(tagId: number | string): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/tags/${tagId}`
  );
  return res.data.data;
}