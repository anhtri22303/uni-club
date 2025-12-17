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
 * (MỚI) Thông tin ngày cụ thể của event
 */
export interface EventDay {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * (MỚI) Thông tin club (host hoặc co-host)
 */
export interface EventClub {
  id: number;
  name: string;
  coHostStatus: "APPROVED" | "REJECTED" | "PENDING";
}

/**
 * (MỚI) Thông tin chi tiết event tại một location
 */
export interface LocationEvent {
  id: number;
  name: string;
  description: string;
  type: "PUBLIC" | "PRIVATE" | "SPECIAL";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: EventDay[];
  status: "COMPLETED" | "ONGOING" | "UPCOMING" | "CANCELLED";
  checkInCode: string;
  budgetPoints: number;
  locationName: string;
  maxCheckInCount: number;
  currentCheckInCount: number;
  commitPointCost: number;
  hostClub: EventClub;
  coHostedClubs: EventClub[];
}

/**
 * (MỚI) Response API khi lấy events theo location
 */
export interface LocationEventsResponse {
  success: boolean;
  message: string;
  data: LocationEvent[];
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
    return response.data;
  } catch (error) {
    console.error(`Error updating location ${id}:`, error);
    throw error;
  }
};

/**
 * (MỚI) Lấy danh sách events theo locationId
 * Tương ứng với: GET /api/events/by-location/{locationId}
 * @param locationId ID của location cần lấy danh sách events
 */
export const getLocationEvents = async (
  locationId: number | string
): Promise<LocationEvent[]> => {
  try {
    const response = await axiosInstance.get<LocationEventsResponse>(
      `/api/events/by-location/${locationId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching events for location ${locationId}:`, error);
    throw error;
  }
};