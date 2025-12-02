import axiosInstance from "@/lib/axiosInstance";

// --- INTERFACES & TYPES ---

/**
 * Interface đại diện cho thông tin sinh viên trong Registry
 */
export interface StudentRegistryItem {
  id?: number;            
  studentCode: string;
  fullName: string;
  majorCode?: string;
  intake?: number;        
  orderNumber?: string;   
}

/**
 * Params cho API tạo thủ công
 */
export interface CreateStudentParams {
  studentCode: string;
  fullName: string;
}

/**
 * Params cho API cập nhật thông tin
 * CẬP NHẬT: Thêm trường studentCode
 */
export interface UpdateStudentParams {
  id: number;
  studentCode: string; // Thêm trường này
  fullName: string;
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
  newRecords: StudentRegistryItem[];
  imported?: number;
  skipped?: number;
  total?: number;
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
 * Thêm một sinh viên thủ công
 * POST /api/university/student-registry/manual
 */
export const createStudentManual = async (
  data: CreateStudentParams
): Promise<StudentRegistryItem> => {
  try {
    const response = await axiosInstance.post<StudentRegistryDetailApiResponse>(
      `/api/university/student-registry/manual`,
      data
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Thêm sinh viên thất bại.");
  } catch (error) {
    console.error("Error creating manual student:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin sinh viên (Tên và MSSV) theo ID
 * PUT /api/university/student-registry/{id}
 */
export const updateStudentRegistry = async ({
  id,
  studentCode,
  fullName,
}: UpdateStudentParams): Promise<StudentRegistryItem> => {
  try {
    const response = await axiosInstance.put<StudentRegistryDetailApiResponse>(
      `/api/university/student-registry/${id}`,
      { 
        studentCode, // Gửi thêm studentCode
        fullName 
      } 
    );

    console.log(`Update student ${id} response:`, response.data);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Cập nhật thông tin thất bại.");
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    throw error;
  }
};

/**
 * Upload danh sách sinh viên từ file Excel/CSV
 * POST /api/university/student-registry/upload
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
          "Content-Type": "multipart/form-data",
        },
      }
    );

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
 */
export const getAllStudentRegistry = async (): Promise<StudentRegistryItem[]> => {
  try {
    const response = await axiosInstance.get<StudentRegistryListApiResponse>(
      `/api/university/student-registry/all`
    );

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

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching student registry:", error);
    throw error;
  }
};

/**
 * Kiểm tra tính hợp lệ của MSSV
 * GET /api/university/student-registry/check/{code}
 */
export const checkStudentCodeValidity = async ({
  code,
}: StudentCodeParams): Promise<StudentRegistryItem> => {
  try {
    const response = await axiosInstance.get<StudentRegistryDetailApiResponse>(
      `/api/university/student-registry/check/${code}`
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Mã số sinh viên không hợp lệ hoặc không tồn tại.");
  } catch (error: any) {
    console.error(`Error checking student code ${code}:`, error);
    throw error;
  }
};

/**
 * Xóa thủ công một sinh viên khỏi Registry
 * DELETE /api/university/student-registry/{code}
 */
export const deleteStudentFromRegistry = async ({
  code,
}: StudentCodeParams): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/university/student-registry/${code}`
    );

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
 */
export const deleteAllStudentRegistry = async (): Promise<void> => {
  try {
    const response = await axiosInstance.delete<StandardApiResponse>(
      `/api/university/student-registry/all`
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to delete all student registry");
    }
  } catch (error) {
    console.error("Error deleting all student registry:", error);
    throw error;
  }
};