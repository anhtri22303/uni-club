import axiosInstance from "@/lib/axiosInstance"

export type ApiWallet = {
  points: number;
  memberships?: ApiMembershipWallet[]; // Array of membership wallets
  [key: string]: any; // Cho phép các thuộc tính khác từ backend
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

export const getWallet = async (): Promise<ApiWallet> => {
  try {
    const res = await axiosInstance.get("/api/wallets/me/memberships")

    // Response is an array of membership wallets
    const memberships: ApiMembershipWallet[] = Array.isArray(res.data) ? res.data : []
    
    // Sum all membership balancePoints to get total points
    const totalPoints = memberships.reduce((sum, membership) => {
      return sum + (Number(membership.balancePoints) || 0)
    }, 0)

    const normalized: ApiWallet = {
      points: totalPoints,
      memberships: memberships
    }
    
    console.log("getWallet (memberships):", {
      totalMemberships: memberships.length,
      totalPoints,
      memberships
    })
    
    return normalized
  } catch (err) {
    console.error("walletApi.getWallet failed", err)
    throw err
  }
}

export type ApiRewardResponse = {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number;
  userFullName: string;
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
    console.log(`rewardPointsToMembers (targetIds: ${targetIds.length} members):`, res.data)
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
//     console.log(`rewardPointsToMember (membershipId: ${membershipId}):`, res.data)
//     return res.data as ApiRewardResponse
//   } catch (err) {
//     console.error(`Failed to reward points to membership ${membershipId}`, err)
//     throw err // Ném lỗi ra để component có thể xử lý
//   }
// }

export const getClubWallet = async (clubId: string | number): Promise<ApiClubWallet> => {
  try {
    const res = await axiosInstance.get(`/api/wallets/club/${clubId}`)
    console.log("getClubWallet:", res.data)
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
    console.log(`pointsToClubs (targetIds: ${targetIds.length} clubs):`, res.data)
    return res.data as ApiRewardClubsResponse
  } catch (err) {
    console.error(`Failed to reward points to clubs`, err)
    throw err
  }
}

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
//     console.log("postClubWalletByClubId:", res.data)
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
    console.log("getClubToMemberTransactions:", res.data)
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
    console.log("getUniToClubTransactions:", res.data)
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

export default {
  getWallet,
  // rewardPointsToMember, // Deprecated
  rewardPointsToMembers,
  getClubWallet,
  // postClubWalletByClubId, // Deprecated
  pointsToClubs,
  getClubToMemberTransactions,
  getUniToClubTransactions
}
