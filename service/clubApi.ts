
import axiosInstance from "@/lib/axiosInstance"
import {jwtDecode} from "jwt-decode"

interface MemberCountData {
  clubId: number;
  activeMemberCount: number;
}
interface MemberCountApiResponse {
  success: boolean;
  message: string;
  data: MemberCountData;
}

export const fetchClub = async (pageable: { page?: number; size?: number; sort?: string[] } = { page: 0, size: 10, sort: ["name"] }) => {
  try {
    // The API expects a `pageable` query parameter (object). We stringify it to match the backend contract.
    const response = await axiosInstance.get("api/clubs", {
      params: {
        pageable: JSON.stringify({
          page: pageable.page ?? 0,
          size: pageable.size ?? 20,
          sort: pageable.sort ?? ["name"],
        }),
      },
    })

    console.log("Fetched clubs:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching clubs:", error)
    throw error
  }
}

// Tạo club mới (POST)
export const createClub = async (clubData: { name: string; description: string; majorPolicyId?: number; majorName?: string }) => {
  try {
    // Support sending either majorPolicyId or majorName depending on backend changes
    const payload: any = {
      name: clubData.name,
      description: clubData.description,
    }
    if (clubData.majorPolicyId !== undefined) payload.majorPolicyId = clubData.majorPolicyId
    if (clubData.majorName !== undefined) payload.majorName = clubData.majorName

    const response = await axiosInstance.post("/api/clubs", payload)
    return response.data
  } catch (error) {
    console.error("Error creating club:", error)
    throw error
  }
}

// Cập nhật club (PUT)
export const updateClub = async (id: string | number, clubData: { name?: string; description?: string; majorPolicyId?: number; majorName?: string }) => {
  try {
    const payload: any = { ...clubData }
    const response = await axiosInstance.put(`/api/clubs/${id}`, payload)
    return response.data
  } catch (error) {
    console.error("Error updating club:", error)
    throw error
  }
}

// Xóa club theo id
export const deleteClub = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`/api/clubs/${id}`)
    return response.data
  } catch (error) {
    console.error("Error deleting club:", error)
    throw error
  }
}

export const getClubById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`/api/clubs/${id}`)
    console.log(`Fetched club by id ${id}:`, response.data)
    return response.data
  } catch (error) {
    console.error(`Error fetching club ${id}:`, error)
    throw error
  }
}


interface JwtPayload {
  clubId?: number
  userId?: number
  role?: string
  email?: string
  exp?: number
}

export const getClubIdFromToken = (): number | null => {
  try {
    const authDataString = localStorage.getItem("uniclub-auth");
    if (!authDataString) {
      console.warn("Không tìm thấy dữ liệu 'uniclub-auth' trong localStorage.");
      return null;
    }

    const authData = JSON.parse(authDataString);

    // Cách 1: Ưu tiên lấy clubId trực tiếp từ đối tượng đã lưu
    if (authData.clubId) {
      console.log("Đã lấy clubId trực tiếp từ localStorage:", authData.clubId);
      return authData.clubId;
    }

    // Cách 2: Phương án dự phòng, giải mã token nếu clubId không có sẵn
    const token = authData?.token;
    if (token) {
      const decoded: JwtPayload = jwtDecode(token);
      console.log("Đã giải mã JWT. Payload:", decoded);
      return decoded.clubId ?? null;
    }

    console.warn("Không tìm thấy clubId nào trong localStorage hoặc token.");
    return null;

  } catch (error) {
    console.error("Lỗi khi xử lý dữ liệu từ localStorage:", error);
    return null;
  }
};

// New: getClubStats - get club statistics
export const getClubStats = async () => {
  try {
    const response = await axiosInstance.get("api/clubs/stats")
    const body = response.data
    console.log("Fetched club stats response:", body)
    
    // If backend uses { success, message, data }
    if (body && typeof body === "object" && "data" in body && "success" in body && (body as any).success) {
      return (body as any).data
    }
    
    // If the endpoint returns the stats object directly
    if (body && typeof body === "object") {
      return body
    }
    
    return null
  } catch (error) {
    console.error("Error fetching club stats:", error)
    throw error
  }
}

// export const getClubMemberCount = async (id: string | number) => {
//   try {
//     const response = await axiosInstance.get(`/api/clubs/${id}/member-count`)
//     // Dựa theo ảnh swagger, số lượng thành viên nằm trong response.data.data.activeMemberCount
//     return response.data?.data?.activeMemberCount ?? 0
//   } catch (error) {
//     console.error(`Error fetching member count for club ${id}:`, error)
//     return 0 // Trả về 0 nếu có lỗi để không làm hỏng giao diện
//   }
// }

export const getClubMemberCount = async (id: string | number) => {
  try {
    const response = await axiosInstance.get<MemberCountApiResponse>(`/api/clubs/${id}/member-count`);
    // Dựa theo ảnh swagger, số lượng thành viên nằm trong response.data.data.activeMemberCount
    return response.data?.data?.activeMemberCount ?? 0
  } catch (error) {
    console.error(`Error fetching member count for club ${id}:`, error)
    return 0 // Trả về 0 nếu có lỗi để không làm hỏng giao diện
  }
}