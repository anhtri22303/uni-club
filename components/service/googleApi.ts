// components/service/googleApi.ts
import axiosInstance from "@/lib/axiosInstance";

interface GoogleLoginResponse {
  token: string;   // token do BE trả về sau khi xác thực Google thành công
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

const googleApi = {
  login: async (googleToken: string): Promise<GoogleLoginResponse> => {
    try {
      const response = await axiosInstance.post<GoogleLoginResponse>(
        "/auth/google",   // endpoint BE cho Google Login
        { token: googleToken }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default googleApi;
