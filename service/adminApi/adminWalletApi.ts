// file: service/adminApi/adminWalletApi.ts

import axiosInstance from "@/lib/axiosInstance"

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc dữ liệu phân trang chung
 * (Sử dụng cho cả danh sách ví và danh sách giao dịch)
 */
export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number // Trang hiện tại (bắt đầu từ 0)
  last: boolean
  first: boolean
  numberOfElements: number
  empty: boolean
}

/**
 * Thông tin Ví
 * Dựa trên: GET /api/admin/wallets
 */
export interface AdminWallet {
  id: number
  ownerName: string
  walletType: string
  balance: number
}

/**
 * Thông tin Giao dịch
 * Dựa trên: GET /api/admin/wallets/transactions và GET /api/admin/wallets/transactions/{id}
 */
export interface AdminTransaction {
  id: number
  senderName: string
  receiverName: string
  type: string // vd: "ADD", "ADMIN_ADJUST"
  amount: number
  createdAt: string // ISO date string (vd: "2025-11-08T18:22:26.241Z")
  note: string
}

// --- Kiểu dữ liệu cho Tham số API ---

/**
 * Tham số cho API lấy danh sách ví
 * GET /api/admin/wallets
 */
export interface FetchWalletsParams {
  page?: number
  size?: number
}

/**
 * Tham số cho API lấy danh sách giao dịch
 * GET /api/admin/wallets/transactions
 */
export interface FetchTransactionsParams {
  page?: number
  size?: number
}

/**
 * Tham số cho API điều chỉnh số dư
 * POST /api/admin/wallets/{walletId}/adjust
 */
export interface AdjustWalletParams {
  walletId: number
  amount: number
  note?: string
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả các ví (phân trang)
 * Tương ứng với: GET /api/admin/wallets
 * @param params Dữ liệu phân trang (page, size)
 */
export const fetchAdminWallets = async (params: FetchWalletsParams) => {
  const response = await axiosInstance.get<Page<AdminWallet>>(
    `/api/admin/wallets`,
    { params },
  )
  return response.data
}

/**
 * Điều chỉnh số dư của một ví (thủ công)
 * Tương ứng với: POST /api/admin/wallets/{walletId}/adjust
 * @param params Gồm walletId (path), amount (query), và note (query)
 */
export const adjustAdminWallet = async ({ walletId, amount, note }: AdjustWalletParams) => {
  const response = await axiosInstance.post(
    `/api/admin/wallets/${walletId}/adjust`,
    null, // Không có body
    { params: { amount, note } }, // Gửi 'amount' và 'note' qua query params
  )
  return response.data // Trả về "OK"
}

/**
 * Lấy danh sách tất cả các giao dịch (phân trang)
 * Tương ứng với: GET /api/admin/wallets/transactions
 * @param params Dữ liệu phân trang (page, size)
 */
export const fetchAdminTransactions = async (params: FetchTransactionsParams) => {
  const response = await axiosInstance.get<Page<AdminTransaction>>(
    `/api/admin/wallets/transactions`,
    { params },
  )
  return response.data
}

/**
 * Lấy chi tiết một giao dịch bằng ID
 * Tương ứng với: GET /api/admin/wallets/transactions/{id}
 * @param id ID của giao dịch (path variable)
 */
export const fetchAdminTransactionDetail = async (id: number) => {
  const response = await axiosInstance.get<AdminTransaction>(
    `/api/admin/wallets/transactions/${id}`,
  )
  return response.data
}