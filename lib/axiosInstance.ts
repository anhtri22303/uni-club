import axios from "axios"


const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/", // Đã cập nhật URL cơ sở của API
  timeout: 10000, // Thay thế bằng thời gian timeout mong muốn (ms)
})


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken")
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


export default axiosInstance
