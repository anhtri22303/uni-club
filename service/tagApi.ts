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
 * Xóa một tag (DELETE /api/tags/{id})
 */
export async function deleteTag(tagId: number | string): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/tags/${tagId}`
  );
  return res.data.data;
}