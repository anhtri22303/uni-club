// src/app/service/signUpApi.ts

import axiosInstance from '../lib/axiosInstance';

// --- Định nghĩa Types ---

// Dữ liệu cần gửi đi khi đăng ký
export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

// Dữ liệu người dùng cơ bản (có thể import từ một file types chung)
export interface User {
  id: string;
  fullName: string;
  email: string;
}

// Dữ liệu nhận về sau khi đăng ký thành công
// Backend có thể chỉ trả về một message, hoặc cả thông tin user vừa tạo
export interface SignUpResponse {
  message: string;
  user?: User; // Dữ liệu user có thể có hoặc không
}


// --- Đối tượng API ---

const signUpApi = {
  /**
   * Gửi yêu cầu đăng ký tài khoản mới đến server.
   * @param {SignUpData} data - Thông tin đăng ký của người dùng (tên, email, mật khẩu).
   * @returns {Promise<SignUpResponse>} Một promise chứa thông báo từ server.
   */
  register: async (data: SignUpData): Promise<SignUpResponse> => {
    try {
      // Gọi API endpoint '/auth/register' với phương thức POST
      const response = await axiosInstance.post<SignUpResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      // Ném lỗi ra ngoài để component hoặc hook có thể bắt và xử lý
      // (ví dụ: hiển thị thông báo lỗi cho người dùng)
      throw error;
    }
  },
};

export default signUpApi;