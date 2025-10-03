// src/app/service/loginApi.ts

import axiosInstance from '../../lib/axiosInstance';

// --- Định nghĩa Types ---
// Dữ liệu cần thiết để gửi đi khi đăng nhập
export interface LoginCredentials {
  email: string;
  password: string;
}

// Dữ liệu người dùng nhận về
export interface User {
  id: string;
  email: string;
  name: string;
  // Thêm các thuộc tính khác của user nếu có
}

// Dữ liệu nhận về sau khi đăng nhập thành công
export interface AuthResponse {
  user: User;
  accessToken: string;
}

// --- Đối tượng API ---
const loginApi = {
  /**
   * Gửi yêu cầu đăng nhập đến server.
   * @param {LoginCredentials} credentials - Thông tin email và mật khẩu.
   * @returns {Promise<AuthResponse>} Dữ liệu trả về gồm user và accessToken.
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Gọi API endpoint '/auth/login' với phương thức POST
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    
    // Nếu có accessToken trả về, lưu nó lại để dùng cho các request sau
    const { accessToken } = response.data;
    if (accessToken) {
      // 1. Lưu token vào localStorage để duy trì đăng nhập sau khi tải lại trang
      localStorage.setItem('accessToken', accessToken);
      // 2. Gán token vào header Authorization cho tất cả các yêu cầu tiếp theo của axiosInstance
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return response.data;
  },

  /**
   * Xử lý đăng xuất cho người dùng.
   */
  logout: () => {
    // 1. Xóa token khỏi localStorage
    localStorage.removeItem('accessToken');
    // 2. Xóa header Authorization khỏi axiosInstance
    delete axiosInstance.defaults.headers.common['Authorization'];
    // Ghi chú: Nếu backend có endpoint để hủy token, bạn có thể gọi nó ở đây.
    // await axiosInstance.post('/auth/logout');
    console.log('User logged out.');
  },

  /**
   * Lấy thông tin người dùng hiện tại dựa trên token đã lưu.
   * @returns {Promise<User>} Thông tin chi tiết của người dùng.
   */
  getCurrentUser: async (): Promise<User> => {
    // Endpoint này yêu cầu phải có token trong header
    const response = await axiosInstance.get<User>('/users/profile/me');
    return response.data;
  },
};

export default loginApi;