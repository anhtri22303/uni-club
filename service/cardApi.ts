import axiosInstance from "../lib/axiosInstance"

// Card design response from backend
export interface CardDesign {
  cardId: number
  clubId: number
  clubName: string
  borderRadius: string
  cardColorClass: string
  cardOpacity: number
  colorType: string
  gradient: string
  logoSize: number
  pattern: string
  patternOpacity: number
  qrPosition: string
  qrSize: number
  qrStyle: string
  showLogo: boolean
  logoUrl: string
  createdAt: string
}

export interface CardApiResponse {
  success: boolean
  message: string
  data: CardDesign
}

// Request body for creating card design
export interface CreateCardRequest {
  borderRadius: string
  cardColorClass: string
  cardOpacity: number
  colorType: string
  gradient: string
  logoSize: number
  pattern: string
  patternOpacity: number
  qrPosition: string
  qrSize: number
  qrStyle: string
  showLogo: boolean
  logoUrl: string
}

// GET /api/cards/club/{clubId} -> returns card design for a specific club
export const getCardByClubId = async (clubId: number): Promise<CardDesign> => {
  try {
    const res = await axiosInstance.get<CardApiResponse>(`/api/cards/club/${clubId}`)
    return res.data.data
  } catch (error: any) {
    console.error("Failed to fetch card design:", error.response?.data || error.message)
    throw error
  }
}

// POST /api/cards/{clubId} -> creates/updates card design for a specific club
export const createCard = async (clubId: number, cardData: CreateCardRequest): Promise<CardDesign> => {
  try {
    const res = await axiosInstance.post<CardApiResponse>(`/api/cards/${clubId}`, cardData)
    return res.data.data
  } catch (error: any) {
    console.error("Failed to create card design:", error.response?.data || error.message)
    throw error
  }
}

