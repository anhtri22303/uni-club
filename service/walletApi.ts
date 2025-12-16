import axiosInstance from "@/lib/axiosInstance"

/**
 * Cấu trúc phản hồi API chuẩn (Thêm mới)
 * (Dùng cho các hàm POST/PATCH/DELETE)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Dữ liệu body cho API chuyển điểm
 * Dựa trên: POST /api/wallets/transfer
 */
export interface TransferPointsBody {
  fromWalletId: number;
  toWalletId: number;
  amount: number;
  description: string;
}

/**
 * Tham số cho API cộng/trừ điểm thủ công
 * Dựa trên: POST /api/wallets/{id}/add & /reduce
 */
export interface AdminAdjustPointsParams {
  id: number; // Wallet ID
  amount: number;
  description: string;
}

/**
 * Tham số cho API thưởng điểm cho 1 user
 * Dựa trên: POST /api/wallets/reward/{userId}
 */
export interface RewardPointsToUserParams {
  userId: number;
  points: number;
  reason?: string;
}

/**
 * Tham số cho API nạp điểm cho 1 CLB
 * Dựa trên: POST /api/wallets/reward/club/{clubId}
 */
export interface RewardPointsToClubParams {
  clubId: number;
  points: number;
  reason?: string;
}

export type ApiWallet = {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number;
  userFullName: string;
};

export type ApiMembershipWallet = {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number;
  userFullName: string;
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

/**
 * Thông tin Ví (Chuẩn hóa)
 * Dựa trên: GET /api/wallets/me và GET /api/wallets/club/{clubId}
 */
export interface Wallet {
  walletId: number;
  balancePoints: number;
  ownerType: string; // "CLUB" hoặc "MEMBER"
  clubId: number | null;
  clubName: string | null;
  userId: number | null;
  userFullName: string | null;
}

/**
 * Thông tin Giao dịch (Chuẩn hóa)
 * Dựa trên: GET .../transactions/...
 */
export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string; // ISO date string
  signedAmount: string; // vd: "+100" hoặc "-50"
  senderName: string;
  receiverName: string;
}

export const getWallet = async (): Promise<ApiResponse<ApiWallet>> => {
  try {
    const res = await axiosInstance.get<ApiResponse<ApiWallet>>("/api/wallets/me")


    return res.data
  } catch (err) {
    console.error("walletApi.getWallet failed", err)
    throw err
  }
}

export interface ApiWalletTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  signedAmount: string;
  senderName: string;
  receiverName: string;
}

export const getWalletTransactions = async (walletId: number): Promise<ApiWalletTransaction[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ApiWalletTransaction[]>>(`/api/wallets/${walletId}/transactions`);
    console.log("Club wallet transactions:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw error;
  }
};

export type ApiRewardResponse = {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number;
  userFullName: string;
};

/**
 * Chuyển điểm giữa hai ví (Admin/Staff)
 * Tương ứng với: POST /api/wallets/transfer
 */
export const transferPoints = async (body: TransferPointsBody) => {
  try {
    const res = await axiosInstance.post<ApiResponse<any>>(
      `/api/wallets/transfer`,
      body
    );
    return res.data;
  } catch (err) {
    console.error("Failed to transfer points", err)
    throw err
  }
};

/**
 * Cộng điểm thủ công (Admin)
 * Tương ứng với: POST /api/wallets/{id}/add
 */
export const adminAddPoints = async ({ id, amount, description }: AdminAdjustPointsParams) => {
  try {
    const res = await axiosInstance.post<ApiResponse<any>>(
      `/api/wallets/${id}/add`,
      { amount, description }
    );
    return res.data;
  } catch (err) {
    console.error(`Failed to add points to wallet ${id}`, err)
    throw err
  }
};

/**
 * Trừ điểm thủ công (Admin)
 * Tương ứng với: POST /api/wallets/{id}/reduce
 */
export const adminReducePoints = async ({ id, amount, description }: AdminAdjustPointsParams) => {
  try {
    const res = await axiosInstance.post<ApiResponse<any>>(
      `/api/wallets/${id}/reduce`,
      { amount, description }
    );
    return res.data;
  } catch (err) {
    console.error(`Failed to reduce points from wallet ${id}`, err)
    throw err
  }
};

/**
 * Thưởng điểm cho MỘT user (Admin, Staff, Club Leader)
 * Tương ứng với: POST /api/wallets/reward/{userId}
 */
export const rewardPointsToUser = async ({ userId, points, reason }: RewardPointsToUserParams) => {
  try {
    const res = await axiosInstance.post<ApiResponse<ApiMembershipWallet>>(
      `/api/wallets/reward/${userId}`,
      null, // Không có body
      { params: { points, reason } }
    );
    return res.data;
  } catch (err) {
    console.error(`Failed to reward points to user ${userId}`, err)
    throw err
  }
};

/**
 * Nạp điểm cho MỘT CLB (Admin, Staff)
 * Tương ứng với: POST /api/wallets/reward/club/{clubId}
 */
export const rewardPointsToClub = async ({ clubId, points, reason }: RewardPointsToClubParams) => {
  try {
    const res = await axiosInstance.post<ApiResponse<any>>( // Swagger ghi data: {}
      `/api/wallets/reward/club/${clubId}`,
      null, // Không có body
      { params: { points, reason } }
    );
    return res.data;
  } catch (err) {
    console.error(`Failed to reward points to club ${clubId}`, err)
    throw err
  }
};

export type ApiRewardMembersTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  receiverName: string;
};

export type ApiRewardMembersResponse = {
  success: boolean;
  message: string;
  data: ApiRewardMembersTransaction[];
};

export const rewardPointsToMembers = async (
  targetIds: number[],
  points: number,
  reason?: string
): Promise<ApiRewardMembersResponse> => {
  try {
    const res = await axiosInstance.post(
      `/api/wallets/reward/members`,
      {
        targetIds,
        points,
        reason: reason || "",
      }
    )
    return res.data as ApiRewardMembersResponse
  } catch (err) {
    console.error(`Failed to reward points to members`, err)
    throw err
  }
}

// Deprecated: Use rewardPointsToMembers instead
// export const rewardPointsToMember = async (
//   membershipId: string | number,
//   points: number,
//   reason?: string
// ): Promise<ApiRewardResponse> => {
//   try {
//     const res = await axiosInstance.post(
//       `/api/wallets/reward/${membershipId}`,
//       null, // Request này không có body
//       {
//         // `points` và `reason` được gửi dưới dạng query parameters
//         params: {
//           points,
//           reason,
//         },
//       }
//     )
//     return res.data as ApiRewardResponse
//   } catch (err) {
//     console.error(`Failed to reward points to membership ${membershipId}`, err)
//     throw err // Ném lỗi ra để component có thể xử lý
//   }
// }

export const getClubWallet = async (clubId: string | number): Promise<ApiClubWallet> => {
  try {
    const res = await axiosInstance.get(`/api/wallets/club/${clubId}`)
    // If response has a 'data' wrapper, extract it
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return (res.data as any).data as ApiClubWallet
    }
    return res.data as ApiClubWallet
  } catch (err) {
    console.error(`Failed to get club wallet for clubId ${clubId}`, err)
    throw err
  }
}

export type ApiRewardClubsTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  receiverName: string;
};

export type ApiRewardClubsResponse = {
  success: boolean;
  message: string;
  data: ApiRewardClubsTransaction[];
};

export const pointsToClubs = async (
  targetIds: number[],
  points: number,
  reason?: string
): Promise<ApiRewardClubsResponse> => {
  try {
    const res = await axiosInstance.post(
      `/api/wallets/reward/clubs`,
      {
        targetIds,
        points,
        reason: reason || "",
      }
    )
    return res.data as ApiRewardClubsResponse
  } catch (err) {
    console.error(`Failed to reward points to clubs`, err)
    throw err
  }
}

/**
 * Lấy lịch sử giao dịch của một ví cụ thể
 * Tương ứng với: GET /api/wallets/{walletId}/transactions
 */
export const getTransactionsByWalletId = async (walletId: number) => {
  try {
    // HÀM MỚI
    const res = await axiosInstance.get<ApiResponse<Transaction[]>>(
      `/api/wallets/${walletId}/transactions`
    );
    return res.data;
  } catch (err) {
    console.error(`Failed to get transactions for wallet ${walletId}`, err);
    throw err;
  }
};

// Deprecated: Use pointsToClubs instead
// export const postClubWalletByClubId = async (
//   clubId: string | number,
//   points: number,
//   reason?: string
// ): Promise<ApiClubWallet> => {
//   try {
//     const res = await axiosInstance.post(
//       `/api/wallets/club/${clubId}/topup`,
//       null, // No body required
//       {
//         // `points` and `reason` are sent as query parameters
//         params: {
//           points,
//           reason,
//         },
//       }
//     )
//     return res.data as ApiClubWallet
//   } catch (err) {
//     console.error(`Failed to topup club wallet for clubId ${clubId}`, err)
//     throw err
//   }
// }

export type ApiClubToMemberTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  senderName: string | null;
  receiverName: string | null;
}

export const getClubToMemberTransactions = async (): Promise<ApiClubToMemberTransaction[]> => {
  try {
    const res = await axiosInstance.get("/api/wallets/transactions/club-to-member")
    // If response has a 'data' wrapper, extract it
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const nestedData = (res.data as any).data
      return Array.isArray(nestedData) ? nestedData : []
    }
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error("Failed to get club-to-member transactions", err)
    throw err
  }
}

export type ApiUniToClubTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  senderName: string | null;
  receiverName: string | null;
}

export const getUniToClubTransactions = async (): Promise<ApiUniToClubTransaction[]> => {
  try {
    const res = await axiosInstance.get("/api/wallets/transactions/uni-to-club")
    // If response has a 'data' wrapper, extract it
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const nestedData = (res.data as any).data
      return Array.isArray(nestedData) ? nestedData : []
    }
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error("Failed to get uni-to-club transactions", err)
    throw err
  }
}

export type ApiUniToEventTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  signedAmount: string;
  senderName: string | null;
  receiverName: string | null;
}

export const getUniToEventTransactions = async (): Promise<ApiUniToEventTransaction[]> => {
  try {
    const res = await axiosInstance.get("/api/wallets/transactions/uni-to-event")
    // If response has a 'data' wrapper, extract it
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const nestedData = (res.data as any).data
      return Array.isArray(nestedData) ? nestedData : []
    }
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error("Failed to get uni-to-event transactions", err)
    throw err
  }
}

export default {
  getWallet,
  getWalletTransactions,
  // rewardPointsToMember, // Deprecated
  rewardPointsToMembers,
  getClubWallet,
  // postClubWalletByClubId, // Deprecated
  pointsToClubs,
  getClubToMemberTransactions,
  getUniToClubTransactions,
  getUniToEventTransactions,
  transferPoints,
  adminAddPoints,
  adminReducePoints,
  rewardPointsToUser,
  rewardPointsToClub,
  getTransactionsByWalletId
}
