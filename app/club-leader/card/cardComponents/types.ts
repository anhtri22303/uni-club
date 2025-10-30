// Types for card customization
export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export interface CardData {
  clubName: string
  studentName: string
  studentCode: string
  email: string
  major: string
  role: string
  memberId: string
}

export interface CardDesign {
  clubId?: number | null
  colorType: string
  gradient: string
  cardColorClass: string
  pattern: string
  borderRadius: string
  logoUrl: string
  backgroundImage: string
  showQR: boolean
  qrPosition: string
  qrSize: number
  qrStyle: string
  showLogo: boolean
  logoSize: number
  patternOpacity: number
  cardOpacity: number
}

