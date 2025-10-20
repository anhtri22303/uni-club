import axiosInstance from "@/lib/axiosInstance"

export type ApiWallet = {
  points: number;
  [key: string]: any; // Cho phép các thuộc tính khác từ backend
};

export const getWallet = async (): Promise<ApiWallet> => {
  try {
    const res = await axiosInstance.get("/api/wallets/me")
    
    // Chuẩn hóa các kiểu trả về khác nhau từ backend thành một trường "points" nhất quán
    const data: any = res.data ?? {}
    const points = Number(
      data.points ?? data.balance ?? data.balancePoints ?? data.balance_points ?? 0
    )
    
    const normalized = { ...data, points }
    console.log("getWallet:", normalized)
    return normalized
  } catch (err) {
    console.error("walletApi.getWallet failed", err)
    throw err
  }
}

export const rewardPointsToMember = async (
  membershipId: string | number,
  points: number,
  reason?: string
): Promise<any> => {
  try {
    const res = await axiosInstance.post(
      `/api/wallets/reward/${membershipId}`,
      null, // Request này không có body
      {
        // `points` và `reason` được gửi dưới dạng query parameters
        params: {
          points,
          reason,
        },
      }
    )
    return res.data
  } catch (err) {
    console.error(`Failed to reward points to membership ${membershipId}`, err)
    throw err // Ném lỗi ra để component có thể xử lý
  }
}

export default {
  getWallet,
  rewardPointsToMember
}
