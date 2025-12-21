import axiosInstance from "@/lib/axiosInstance";

// ==========================================
// 1. INTERFACES
// ==========================================

export interface ClubMonthlyActivity {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEvents: number;
  eventSuccessRate: number; //
  avgFeedback: number;
  finalScore: number;
  awardScore: number;
  awardLevel: string;
  rewardPoints: number; //
  locked: boolean;
  lockedAt: string;
  lockedBy: string;
}

export interface ClubActivityBreakdown {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEvents: number;
  avgFeedback: number;
  avgCheckinRate: number;
  avgMemberActivityScore: number; // Vẫn còn trong JSON /breakdown
  staffPerformanceScore: number;  // Vẫn còn trong JSON /breakdown
  finalScore: number;
  rewardPoints: number;
  awardScore: number;
  awardLevel: string;
}

export interface ClubActivityProcessResult {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEvents: number;
  eventSuccessRate: number;
  avgFeedback: number;
  finalScore: number;
  awardScore: number;
  awardLevel: string;
  rewardPoints: number;
  locked: boolean;
  lockedAt: string;
  lockedBy: string;
}

export interface ApproveResult {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  rewardPoints: number;
  locked: boolean;
  lockedAt: string;
  lockedBy: string;
  walletBalance: number;
  approved: boolean;
  approvedBy: string;
  approvedAt: string;
}

export interface ClubMonthlySummary {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEvents: number;
  completedEvents: number;
  eventSuccessRate: number;
  totalCheckins: number;
  totalFeedbacks: number;
  avgFeedback: number;
}

// Các interface khác giữ nguyên...
export interface ClubTrendingItem { clubId: number; clubName: string; currentScore: number; previousScore: number; scoreDiff: number; percentGrowth: number; }
export interface ClubComparisonResult { clubA: ClubActivityBreakdown; clubB: ClubActivityBreakdown; }
export interface ClubActivityHistoryItem { month: number; score: number; }
export interface ClubEventContribution { eventId: number; eventName: string; feedback: number; checkinRate: number; weight: number; }

// ==========================================
// 2. HELPERS
// ==========================================

// Hàm helper để xử lý dữ liệu dù BE có bọc hay không
const handleData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    return response.data.data;
  }
  return response.data;
};

// ==========================================
// 3. API FUNCTIONS
// ==========================================

export const getClubActivityReport = async (params: ClubPeriodParams) => 
  handleData<ClubMonthlyActivity>(await axiosInstance.get(`/api/club-activity/${params.clubId}`, { params }));

export const getClubActivityBreakdown = async (params: ClubPeriodParams) => 
  handleData<ClubActivityBreakdown>(await axiosInstance.get(`/api/club-activity/${params.clubId}/breakdown`, { params }));

export const getTrendingClubs = async (params: BasePeriodParams) => 
  handleData<ClubTrendingItem[]>(await axiosInstance.get(`/api/club-activity/trending`, { params }));

export const getClubRanking = async (params: BasePeriodParams) => 
  handleData<ClubActivityProcessResult[]>(await axiosInstance.get(`/api/club-activity/ranking`, { params }));

export const compareClubs = async (params: CompareParams) => 
  handleData<ClubComparisonResult>(await axiosInstance.get(`/api/club-activity/compare`, { params }));

export const getClubActivityHistory = async (clubId: number, year: number) => 
  handleData<ClubActivityHistoryItem[]>(await axiosInstance.get(`/api/club-activity/${clubId}/history`, { params: { year } }));

export const checkClubActivityExists = async (params: ClubPeriodParams) => 
  handleData<boolean>(await axiosInstance.get(`/api/club-activity/${params.clubId}/exists`, { params }));

export const getClubEventContributions = async (params: ClubPeriodParams) => 
  handleData<ClubEventContribution[]>(await axiosInstance.get(`/api/club-activity/${params.clubId}/events`, { params }));

export const getMonthlySummary = async (params: BasePeriodParams) => 
  handleData<ClubMonthlySummary[]>(await axiosInstance.get(`/api/club-activity/monthly-summary`, { params }));

// ACTIONS
export const recalculateClubActivity = async (params: ClubPeriodParams) => 
  handleData<ClubActivityProcessResult>(await axiosInstance.post(`/api/club-activity/${params.clubId}/recalculate`, null, { params }));

export const lockClubActivity = async (params: ClubPeriodParams) => 
  handleData<ClubActivityProcessResult>(await axiosInstance.post(`/api/club-activity/${params.clubId}/lock`, null, { params }));

export const approveClubActivity = async (params: ClubPeriodParams) => 
  handleData<ApproveResult>(await axiosInstance.post(`/api/club-activity/${params.clubId}/approve`, null, { params }));

export const recalculateAllClubs = async (params: BasePeriodParams) => 
  handleData<ClubActivityProcessResult[]>(await axiosInstance.post(`/api/club-activity/recalculate-all`, null, { params }));

// Params Types
export interface BasePeriodParams { year: number; month: number; }
export interface ClubPeriodParams extends BasePeriodParams { clubId: number; }
export interface CompareParams extends BasePeriodParams { clubA: number; clubB: number; }