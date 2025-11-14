import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Thông tin chi tiết một địa điểm
 * Dựa trên: GET /api/locations/{id}, POST /api/locations
 */
export interface Location {
  id: number;
  name: string;
  address: string;
  capacity: number;
}

/**
 * Dữ liệu để tạo một địa điểm mới
 * Dựa trên: POST /api/locations (Request body)
 */
export interface CreateLocationRequest {
  name: string;
  address: string;
  capacity: number;
}

/**
 * (MỚI) Dữ liệu để cập nhật một địa điểm
 * Dựa trên: PUT /api/locations/{id} (Request body)
 */
export interface UpdateLocationRequest {
  name: string;
  address: string;
  capacity: number;
}

/**
 * (MỚI) Cấu trúc phản hồi API chung khi thành công
 * Dựa trên: PUT /api/locations/{id} (Response 200)
 */
export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Các interface cho phản hồi phân trang (Pageable)
 * (Giữ nguyên từ file cũ của bạn, vì đây là cấu trúc Page chuẩn)
 */
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface LocationsApiResponse {
  content: Location[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

/**
 * Tham số cho API lấy danh sách địa điểm
 * Dựa trên: GET /api/locations
 */
export interface FetchLocationsParams {
  page?: number;
  size?: number;
  sort?: string[]; // Ví dụ: ["name,asc", "capacity,desc"]
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách địa điểm (phân trang)
 * Tương ứng với: GET /api/locations
 * @param params Gồm page, size, sort (gửi trực tiếp qua query params)
 */
export const fetchLocation = async (params: FetchLocationsParams = { page: 0, size: 20 }) => {
  try {
    // SỬA LỖI: Gửi params trực tiếp, không bọc trong "pageable"
    // Thêm "/" ở đầu path
    const response = await axiosInstance.get<LocationsApiResponse>("/api/locations", {
      params: params, // Sẽ tự động chuyển đổi thành ?page=0&size=20
    });

    console.log("Fetched locations:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết một địa điểm bằng ID
 * Tương ứng với: GET /api/locations/{id}
 * @param id ID của địa điểm
 */
export const getLocationById = async (id: string | number) => {
  try {
    // Thêm "/" ở đầu path
    const response = await axiosInstance.get<Location>(`/api/locations/${id}`);
    console.log("Fetched location by id:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching location ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo một địa điểm mới
 * Tương ứng với: POST /api/locations
 * @param data Dữ liệu địa điểm mới (name, address, capacity)
 */
export const postLocation = async (data: CreateLocationRequest): Promise<Location> => {
  try {
    // Thêm "/" ở đầu path
    const response = await axiosInstance.post<Location>("/api/locations", data);
    console.log("Created location response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
};

/**
 * Xóa một địa điểm bằng ID
 * Tương ứng với: DELETE /api/locations/{id}
 * @param locationId ID của địa điểm cần xóa
 */
export const deleteLocation = async (locationId: number): Promise<void> => {
  try {
    // SỬA LỖI: API trả về 204 No Content (body rỗng), không phải JSON
    // Thêm "/" ở đầu path
    const response = await axiosInstance.delete(`/api/locations/${locationId}`);

    // Log status (ví dụ: 204) thay vì data
    console.log("Deleted location status:", response.status);

    // Không trả về gì cả (Promise<void>)
    return;
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
};

/**
 * (MỚI) Cập nhật một địa điểm bằng ID
 * Tương ứng với: PUT /api/locations/{id}
 * @param id ID của địa điểm cần cập nhật
 * @param data Dữ liệu cập nhật (name, address, capacity)
 */
export const updateLocation = async (
  id: number | string,
  data: UpdateLocationRequest
): Promise<ApiSuccessResponse<Location>> => {
  try {
    const response = await axiosInstance.put<ApiSuccessResponse<Location>>(
      `/api/locations/${id}`,
      data
    );
    console.log("Updated location response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating location ${id}:`, error);
    throw error;
  }
};