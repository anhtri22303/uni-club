import axiosInstance from "@/lib/axiosInstance";

// --- INTERFACES & TYPES ---

/**
 * Interface đại diện cho thông tin sinh viên trong Registry
 * (Dựa trên context quản lý sinh viên)
 */
export interface StudentRegistryItem {
  studentCode: string; // MSSV
  fullName: string;
  majorCode?: string; // Mã ngành (nếu có)
  enrollmentYear?: number; // Khóa (nếu có)
  // Các trường khác tùy thuộc vào dữ liệu trả về thực tế từ BE
}

/**
 * Interface response chung khi data là danh sách sinh viên
 */
export interface StudentRegistryListApiResponse {
  success: boolean;
  message: string;
  data: StudentRegistryItem[];
}

/**
 * Interface response khi data là thông tin chi tiết một sinh viên
 */
export interface StudentRegistryDetailApiResponse {
  success: boolean;
  message: string;
  data: StudentRegistryItem;
}

/**
 * Interface response chuẩn cho các thao tác không trả về data cụ thể (như Delete)
 */
export interface StandardApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null;
}

/**
 * Params cho API Search
 */
export interface SearchStudentRegistryParams {
  keyword: string;
}

/**
 * Params cho API Check và Delete (dùng MSSV làm path param)
 */
export interface StudentCodeParams {
  code: string;
}

/**
 * Interface dữ liệu trả về sau khi upload thành công
 */
export interface UploadRegistryResult {
  imported: number;
  skipped: number;
  total: number;
}

/**
 * Interface response cho API Upload
 */
export interface UploadRegistryApiResponse {
  success: boolean;
  message: string;
  data: UploadRegistryResult;
}

// --- API FUNCTIONS ---

/**
 * Upload danh sách sinh viên từ file Excel/CSV
 * POST /api/university/student-registry/upload
 * @param file - File được chọn từ input (CSV hoặc XLSX)
 */
export const uploadStudentRegistry = async (file: File): Promise<UploadRegistryResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<UploadRegistryApiResponse>(
      `/api/university/student-registry/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Quan trọng để gửi file
        },
      }
    );

    console.log("Upload student registry response:", response.data);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Upload thất bại.");
  } catch (error) {
    console.error("Error uploading student registry:", error);
    throw error;
  }
};

/**
 * Lấy toàn bộ danh sách sinh viên trong Registry
 * GET /api/university/student-registry/all
 * Dùng cho: Kiểm tra dữ liệu import, Debug, UI Admin
 */
export const getAllStudentRegistry = async (): Promise<StudentRegistryItem[]> => {
  try {
    const response = await axiosInstance.get<StudentRegistryListApiResponse>(
      `/api/university/student-registry/all`
    );

    console.log("Fetched all student registry response:", response.data);

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }

    return [];
  } catch (error) {
    console.error("Error fetching all student registry:", error);
    throw error;
  }
};

/**
 * Tìm kiếm sinh viên theo tên hoặc MSSV
 * GET /api/university/student-registry/search
 * @param keyword - Từ khóa tìm kiếm (MSSV hoặc tên)
 */
export const searchStudentRegistry = async ({
  keyword,
}: SearchStudentRegistryParams): Promise<StudentRegistryItem[]> => {
  try {
    const response = await axiosInstance.get<StudentRegistryListApiResponse>(
      `/api/university/student-registry/search`,
      {
        params: { keyword },
      }
    );

    console.log("Search student registry response:", response.data);

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Nếu không tìm thấy hoặc lỗi, trả về mảng rỗng hoặc throw tùy logic
    return [];
  } catch (error) {
    console.error("Error searching student registry:", error);
    throw error;
  }
};

/**
 * Kiểm tra tính hợp lệ của MSSV (Dùng khi đăng ký tài khoản mới)
 * GET /api/university/student-registry/check/{code}
 * @param code - Mã số sinh viên cần kiểm tra
 * Logic BE: Trim, uppercase, check định dạng, check tồn tại trong registry
 */
export const checkStudentCodeValidity = async ({
  code,
}: StudentCodeParams): Promise<StudentRegistryItem> => {
  try {
    const response = await axiosInstance.get<StudentRegistryDetailApiResponse>(
      `/api/university/student-registry/check/${code}`
    );

    console.log(`Checked validity for student code ${code}:`, response.data);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Mã số sinh viên không hợp lệ hoặc không tồn tại.");
  } catch (error: any) {
    console.error(`Error checking student code ${code}:`, error);
    // Re-throw error để UI component (Form đăng ký) có thể bắt được message lỗi (ví dụ: "MSSV không tồn tại")
    throw error;
  }
};

/**
 * Xóa thủ công một sinh viên khỏi Registry
 * DELETE /api/university/student-registry/{code}
 * @param code - Mã số sinh viên cần xóa
 */
export const deleteStudentFromRegistry = async ({
  code,
}: StudentCodeParams): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/university/student-registry/${code}`
    );

    console.log(`Deleted student ${code} response:`, response.data);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || `Failed to delete student ${code}`);
    }
  } catch (error) {
    console.error(`Error deleting student ${code}:`, error);
    throw error;
  }
};

/**
 * Xóa sạch toàn bộ Student Registry (ADMIN ONLY)
 * DELETE /api/university/student-registry/all
 * Dùng khi: Import dữ liệu năm học mới, dọn dẹp data lỗi
 */
export const deleteAllStudentRegistry = async (): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/university/student-registry/all`
    );

    console.log("Deleted ALL student registry response:", response.data);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to delete all student registry");
    }
  } catch (error) {
    console.error("Error deleting all student registry:", error);
    throw error;
  }
};