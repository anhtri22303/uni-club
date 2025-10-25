import axiosInstance from "@/lib/axiosInstance"

export type ApiWallet = {
  points: number;
  [key: string]: any; // Cho phép các thuộc tính khác từ backend
};

export type ApiClubWallet = {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number | null;
  userFullName: string | null;
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

export const distributePointsToClubs = async (
  clubIds: (string | number)[],
  points: number,
  reason?: string
): Promise<any> => {
  try {
    // Endpoint này cần được tạo ở backend
    // Ví dụ: POST /api/wallets/distribute/clubs
    const res = await axiosInstance.post(
      "/api/wallets/distribute/clubs",
      // Dữ liệu được gửi trong body của request
      {
        clubIds,
        points, // Số điểm cho mỗi CLB
        reason,
      }
    )
    return res.data
  } catch (err) {
    console.error(`Failed to distribute points to clubs`, err)
    throw err // Ném lỗi ra để component xử lý và hiển thị toast
  }
}

export const getClubWallet = async (clubId: string | number): Promise<ApiClubWallet> => {
  try {
    const res = await axiosInstance.get(`/api/wallets/club/${clubId}`)
    console.log("getClubWallet:", res.data)
    return res.data as ApiClubWallet
  } catch (err) {
    console.error(`Failed to get club wallet for clubId ${clubId}`, err)
    throw err
  }
}

export default {
  getWallet,
  rewardPointsToMember,
  distributePointsToClubs,
  getClubWallet
}
