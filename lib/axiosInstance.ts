import axios from "axios"


const axiosInstance = axios.create({
  // baseURL: "http://localhost:8080",
  baseURL: "https://uniclub-qyn9a.ondigitalocean.app/",
  timeout: 10000, // Thay thế bằng thời gian timeout mong muốn (ms)
})


axiosInstance.interceptors.request.use(
  (config) => {
    // localStorage is only available in the browser. Guard access so this
    // module can be imported on the server without throwing ReferenceError.
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jwtToken")
      if (token) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


export default axiosInstance
