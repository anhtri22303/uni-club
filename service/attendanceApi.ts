import axiosInstance from "@/lib/axiosInstance"

export const fetchAttendanceByDate = async (date: string) => {
  const response = await axiosInstance.get(`/api/attendance?date=${date}`)
  return response.data
}

export const saveAttendanceRecord = async (records: any[]) => {
  const response = await axiosInstance.post(`/api/attendance`, records)
  return response.data
}
