import axiosInstance from "@/lib/axiosInstance"

export async function getWallet() {
  try {
    const res = await axiosInstance.get("/api/wallets/me")
    // Normalize various possible backend shapes into a consistent "points" field
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
