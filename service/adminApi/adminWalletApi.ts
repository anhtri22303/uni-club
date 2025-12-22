import axiosInstance from "@/lib/axiosInstance"

// --- Cấu trúc dữ liệu bổ trợ (Dựa trên Spring Data JPA) ---

export interface Sort {
  direction: string
  nullHandling: string
  ascending: boolean
  property: string
  ignoreCase: boolean
}

export interface Pageable {
  pageNumber: number
  pageSize: number
  paged: boolean
  offset: number
  sort: Sort[]
  unpaged: boolean
}

/**
 * Cấu trúc dữ liệu phân trang chuẩn từ Swagger
 */
export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  last: boolean
  first: boolean
  numberOfElements: number
  empty: boolean
  pageable: Pageable
  sort: Sort[]
}

// --- Model dữ liệu ---

/**
 * Thông tin Ví
 * GET /api/admin/wallets
 */
export interface AdminWallet {
  id: number
  ownerName: string
  walletType: string
  balance: number
}

/**
 * Thông tin Giao dịch
 * GET /api/admin/wallets/transactions
 */
export interface AdminTransaction {
  id: number
  senderName: string
  receiverName: string
  type: "ADD" | "ADMIN_ADJUST" | string // Cập nhật dựa trên enum mẫu
  amount: number
  createdAt: string // ISO Date format
  note: string
}

// --- Kiểu dữ liệu cho Tham số API ---

export interface FetchWalletsParams {
  page?: number
  size?: number
}

export interface FetchTransactionsParams {
  page?: number
  size?: number
}

export interface AdjustWalletParams {
  walletId: number
  amount: number
  note?: string
}

export interface FetchWalletsParams {
  page?: number
  size?: number
  type?: string // Lọc theo loại ví
  sort?: string // Định dạng: "property,asc" hoặc "property,desc"
}

export interface FetchTransactionsParams {
  page?: number
  size?: number
  type?: string // Lọc theo loại giao dịch
  sort?: string
}

// --- Các hàm gọi API ---

/**
 * Lấy danh sách ví (phân trang)
 * GET /api/admin/wallets
 */
export const fetchAdminWallets = async (params: FetchWalletsParams) => {
  const response = await axiosInstance.get<Page<AdminWallet>>(
    `/api/admin/wallets`,
    { params },
  )
  return response.data
}

/**
 * Điều chỉnh số dư ví thủ công
 * POST /api/admin/wallets/{walletId}/adjust
 * Truyền amount và note qua Query Parameters theo Swagger
 */
export const adjustAdminWallet = async ({ walletId, amount, note }: AdjustWalletParams) => {
  const response = await axiosInstance.post(
    `/api/admin/wallets/${walletId}/adjust`,
    null, // Body trống
    {
      params: { amount, note },
    },
  )
  return response.data // Trả về "OK" (String)
}

/**
 * Lấy danh sách giao dịch (phân trang)
 * GET /api/admin/wallets/transactions
 */
export const fetchAdminTransactions = async (params: FetchTransactionsParams) => {
  const response = await axiosInstance.get<Page<AdminTransaction>>(
    `/api/admin/wallets/transactions`,
    { params },
  )
  return response.data
}

/**
 * Xem chi tiết một giao dịch
 * GET /api/admin/wallets/transactions/{id}
 */
export const fetchAdminTransactionDetail = async (id: number) => {
  const response = await axiosInstance.get<AdminTransaction>(
    `/api/admin/wallets/transactions/${id}`,
  )
  return response.data
}