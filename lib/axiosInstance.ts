import axios from "axios"

const axiosInstance = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/",
  //baseURL: process.env.NEXT_PUBLIC_API_URL || "https://uniclub-qyn9a.ondigitalocean.app/",
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://uniclub-qyn9a.ondigitalocean.app/",
  timeout: 120000, // Increased to 120 seconds for batch operations with many items
})


axiosInstance.interceptors.request.use(
  (config) => {
    // sessionStorage is only available in the browser. Guard access so this
    // module can be imported on the server without throwing ReferenceError.
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("jwtToken")
      if (token) {
        config.headers = config.headers || {};
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
