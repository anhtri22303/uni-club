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
  description: string;
  core: boolean;
}

// --- Interface for Tag Creation Payload ---
// DTO (Data Transfer Object) cho body của request POST /api/tags
// Swagger (ảnh POST) chỉ yêu cầu 'name'
export interface CreateTagDto {
  name: string;
  description: string;
  core: boolean;
}

// --- Interface for Tag Update Payload ---
// DTO (Data Transfer Object) cho body của request PUT /api/tags/{id}
export interface UpdateTagDto {
  name: string;
  description: string;
  core: boolean;
}

// --- API Functions ---

/**
 * Lấy danh sách TẤT CẢ các tag (GET /api/tags)
 * Public API — bất kỳ ai cũng xem được.
 */
export async function getTags(): Promise<Tag[]> {
  const res = await axiosInstance.get<ApiResponse<Tag[]>>(
    "/api/tags"
  );
  return res.data.data;
}

/**
 * Thêm một tag mới (POST /api/tags)
 * ADMIN hoặc UNIVERSITY_STAFF có thể tạo tag mới.
 * Dựa trên Swagger (ảnh POST), tham số là 'name'
 */
export async function addTag(data: CreateTagDto): Promise<Tag> {
  // Gửi data đầy đủ (name, description, core) trong body request
  const res = await axiosInstance.post<ApiResponse<Tag>>(
    "/api/tags",
    data
  );
  return res.data.data;
}

/**
 * Cập nhật một tag (PUT /api/tags/{id})
 * ADMIN và UNIVERSITY_STAFF có quyền sửa tag.
 * Core tags không được chỉnh sửa.
 */
export async function updateTag(
  tagId: number | string,
  data: UpdateTagDto
): Promise<Tag> {
  const res = await axiosInstance.put<ApiResponse<Tag>>(
    `/api/tags/${tagId}`,
    data // Gửi 'data' (name, description, core)
  );
  return res.data.data;
}
/**
 * Xóa một tag (DELETE /api/tags/{id})
 * Chỉ ADMIN và UNIVERSITY_STAFF. Core tags không bị xóa.
 */
export async function deleteTag(tagId: number | string): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/tags/${tagId}`
  );
  return res.data.data;
}