"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Users,
  MapPin,
  Mail,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  DollarSign,
  Loader2,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getEventById,
  putEventStatus,
  getEventSummary,
  EventSummary,
  EventDay,
  completeEvent,
  getEventSettle,
  rejectEvent,
  cancelEvent,
} from "@/service/eventApi";
import { EventDateTimeDisplay } from "@/components/event-date-time-display";
import { useToast } from "@/hooks/use-toast";
import { renderTypeBadge } from "@/lib/eventUtils";
import { getLocationById } from "@/service/locationApi";
import { getClubById } from "@/service/clubApi";
import { EventWalletHistoryModal } from "@/components/event-wallet-history-modal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getFeedbackByEventId, Feedback } from "@/service/feedbackApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApproveBudgetModal } from "@/components/approve-budget-modal";
import { CancelEventModal } from "@/components/cancel-event-modal";
import AttendeeListModal from "@/components/attendee-list-modal";
import RegistrationListModal from "@/components/registration-list-modal";

// Bảng màu theo ngành học (giống như trong clubs page)
const majorColors: Record<string, string> = {
  "Software Engineering": "#0052CC",
  "Artificial Intelligence": "#6A00FF",
  "Information Assurance": "#243447",
  "Data Science": "#00B8A9",
  "Business Administration": "#1E2A78",
  "Digital Marketing": "#FF3366",
  "Graphic Design": "#FFC300",
  "Multimedia Communication": "#FF6B00",
  "Hospitality Management": "#E1B382",
  "International Business": "#007F73",
  "Finance and Banking": "#006B3C",
  "Japanese Language": "#D80032",
  "Korean Language": "#5DADEC",
};

const getMajorColor = (majorName?: string | null): string => {
  if (!majorName) return "#E2E8F0";
  return majorColors[majorName] || "#E2E8F0";
};

const getContrastTextColor = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#111827" : "#FFFFFF";
};

// Helper functions to safely get event date
const getEventDate = (event: any): Date | null => {
  // Multi-day event: use startDate or first day's date
  if (event.days && event.days.length > 0) {
    return event.days[0].date ? new Date(event.days[0].date) : null
  }
  // Single-day event: use date field
  if (event.date) {
    return new Date(event.date)
  }
  return null
}

const getEventDateString = (event: any): string => {
  const date = getEventDate(event)
  return date ? date.toISOString().split('T')[0] : ''
}

const formatEventDateTime = (event: any): string => {
  const date = getEventDate(event)
  if (!date) return 'Invalid Date'
  
  // Add time if available
  const time = event.startTime || event.time
  if (time) {
    let timeStr = time
    if (typeof time === 'object' && time !== null) {
      const pad = (n: number) => n.toString().padStart(2, '0')
      timeStr = `${pad(time.hour || 0)}:${pad(time.minute || 0)}`
    }
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })} at ${timeStr}`
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface EventRequestDetailPageProps {
  params: {
    id: string;
  };
}

export default function EventRequestDetailPage({
  params,
}: EventRequestDetailPageProps) {
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<any | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [club, setClub] = useState<any | null>(null);
  const [clubLoading, setClubLoading] = useState<boolean>(false);
  const [clubError, setClubError] = useState<string | null>(null);
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [isEventSettled, setIsEventSettled] = useState(false);
  const [checkingSettled, setCheckingSettled] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Attendee List modal state
  const [showAttendeeListModal, setShowAttendeeListModal] = useState(false);

  // Registration List modal state
  const [showRegistrationListModal, setShowRegistrationListModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const FEEDBACKS_PER_PAGE = 5;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data: any = await getEventById(params.id);
        if (!mounted) return;
        setRequest(data);

        // Fetch event summary if APPROVED, ONGOING or COMPLETED
        if (
          data.status === "APPROVED" ||
          data.status === "ONGOING" ||
          data.status === "COMPLETED"
        ) {
          try {
            setSummaryLoading(true);
            const summaryData = await getEventSummary(params.id);
            if (mounted) setEventSummary(summaryData);
          } catch (summaryError) {
            console.error("Failed to load event summary:", summaryError);
            // Don't show error toast for summary, it's not critical
          } finally {
            if (mounted) setSummaryLoading(false);
          }
        }

        // Check if event is settled (if COMPLETED status)
        if (data.status === "COMPLETED") {
          try {
            setCheckingSettled(true);
            const settledEvents = await getEventSettle();
            const isSettled = settledEvents.some((e: any) => e.id === data.id);
            if (mounted) setIsEventSettled(isSettled);
          } catch (settledError) {
            console.error("Failed to check settled events:", settledError);
            // Don't show error toast, it's not critical
          } finally {
            if (mounted) setCheckingSettled(false);
          }
        }

        // if the event has a locationId, fetch that location
        if (data && (data.locationId || data.venueId || data.location)) {
          const locId = data.locationId ?? data.venueId ?? data.location;
          setLocationLoading(true);
          try {
            const loc = await getLocationById(locId);
            if (!mounted) return;
            // API may wrap in { data: {...} } or return object directly
            const normalized =
              loc && (loc as any).data ? (loc as any).data : loc;
            setLocation(normalized);
          } catch (err: any) {
            console.error(err);
            if (!mounted) return;
            setLocationError(err?.message || "Failed to load location");
          } finally {
            if (mounted) setLocationLoading(false);
          }
        }
        // if the event has a clubId, fetch that club
        if (data && (data.clubId || data.requestedByClubId || data.club)) {
          const clubId = data.clubId ?? data.requestedByClubId ?? data.club;
          setClubLoading(true);
          try {
            const c = await getClubById(clubId);
            if (!mounted) return;
            const normalizedClub = c && (c as any).data ? (c as any).data : c;
            setClub(normalizedClub);
          } catch (err: any) {
            console.error(err);
            if (!mounted) return;
            setClubError(err?.message || "Failed to load club");
          } finally {
            if (mounted) setClubLoading(false);
          }
        }

        // Fetch feedback for ALL statuses (requested)
        try {
          setFeedbackLoading(true);
          const feedbackData = await getFeedbackByEventId(params.id);
          if (mounted) setFeedbacks(feedbackData);
        } catch (feedbackError) {
          console.error("Failed to load feedback:", feedbackError);
        } finally {
          if (mounted) setFeedbackLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (!mounted) return;
        setError(err?.message || "Failed to load event");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  // Reset to page 1 when filter changes (must be before any conditional returns)
  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="py-8 text-center">
            <Card>
              <CardContent className="py-8">Loading event...</CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !request) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Event Request Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The requested event request could not be found.
            </p>
            <Link href="/uni-staff/events-req">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event Requests
              </Button>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-900 text-white border-blue-900"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "ONGOING":
        return (
          <Badge
            variant="default"
            className="bg-purple-600 text-white border-purple-600"
          >
            <Clock className="h-3 w-3 mr-1" />
            Ongoing
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 border-green-500"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "PENDING_COCLUB":
        return (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 border-orange-500"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending Co-Club Approval
          </Badge>
        );
      case "PENDING_UNISTAFF":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-700 border-yellow-500"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending Uni-Staff Approval
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-500"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // effective status (prefer status over type) for checks and display
  const effectiveStatus = (request.status ?? request.type ?? "")
    .toString()
    .toUpperCase();

  // const updateStatus = async (status: string) => {
  //   if (!request) return
  //   setProcessing(true)
  //   try {
  //     await putEventStatus(request.id, status, request.budgetPoints || 0)
  //     // optimistic/local update
  //     setRequest({ ...request, status })
  //     toast({ title: status === "APPROVED" ? "Approved" : "Rejected", description: `Event ${request.name || request.id} ${status === "APPROVED" ? "approved" : "rejected"}.` })
  //   } catch (err: any) {
  //     console.error('Update status failed', err)
  //     toast({ title: 'Error', description: err?.message || 'Failed to update event status' })
  //   } finally {
  //     setProcessing(false)
  //   }
  // }
  // 'updateStatus' được chia thành 'handleApprove' và 'handleReject'
  // vì 'putEventStatus' API mới (approve-budget) chỉ xử lý việc duyệt.

  const handleApprove = async () => {
    if (!request) return;
    setProcessing(true);
    try {
      // Gọi API theo signature mới: (id, approvedBudgetPoints)
      const approvedBudgetPoints = request.budgetPoints || 0;
      const updatedEvent = await putEventStatus(
        request.id,
        approvedBudgetPoints
      );

      // Cập nhật state với event (đã được duyệt) trả về từ API
      setRequest(updatedEvent);

      toast({
        title: "Approved",
        description: `Event ${
          request.name || request.id
        } approved with ${approvedBudgetPoints} points.`,
      });
    } catch (err: any) {
      console.error("Approve status failed", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to approve event",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // const handleReject = async () => {
  //   if (!request) return
  //   // Hiển thị hộp thoại (prompt) để nhập lý do từ chối
  //   // (Để có UX tốt hơn, bạn có thể thay thế bằng một Dialog/Modal component)
  //   const reason = window.prompt("Please enter a reason for rejecting this event:")

  //   // Nếu người dùng nhấn "Cancel" hoặc không nhập gì
  //   if (!reason) {
  //     toast({
  //       title: "Cancelled",
  //       description: "Rejection was cancelled.",
  //       variant: "default"
  //     })
  //     return // Dừng hàm
  //   }

  //   setProcessing(true)
  //   try {
  //     // Gọi API 'rejectEvent' mới với lý do
  //     await rejectEvent(request.id, reason)

  //     // Cập nhật state local để UI thay đổi ngay lập tức
  //     setRequest({ ...request, status: "REJECTED" })

  //     toast({
  //       title: "Event Rejected",
  //       description: `Event ${request.name || request.id} has been rejected.`,
  //     })

  //   } catch (err: any) {
  //     console.error('Reject status failed', err)
  //     toast({
  //       title: 'Error',
  //       description: err?.response?.data?.message || err?.message || 'Failed to reject event',
  //       variant: "destructive"
  //     })
  //   } finally {
  //     setProcessing(false)
  //   }
  // }
  const handleReject = async () => {
    if (!request) return;

    // Mở modal để nhập lý do
    setRejectReason(""); // Xóa lý do cũ (nếu có)
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!request || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Gọi API 'rejectEvent' mới với lý do từ state
      await rejectEvent(request.id, rejectReason);

      // Cập nhật state local để UI thay đổi ngay lập tức
      setRequest({ ...request, status: "REJECTED" });

      toast({
        title: "Event Rejected",
        description: `Event ${request.name || request.id} has been rejected.`,
      });

      setShowRejectModal(false); // Đóng modal
    } catch (err: any) {
      console.error("Reject status failed", err);
      // Hiển thị lỗi API trực tiếp
      const apiError =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reject event";
      toast({
        title: "Error",
        description: apiError,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleCancelEvent = () => {
    if (!request) return;
    // Open modal for reason input
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!request) return;

    setCancelling(true);
    try {
      // Call API with reason parameter
      await cancelEvent(request.id, reason);
      
      // Refresh event data
      const updatedData = await getEventById(params.id);
      setRequest(updatedData);
      
      toast({
        title: "Event Cancelled",
        description: `Event ${request.name || request.id} has been cancelled successfully.`,
      });
    } catch (err: any) {
      console.error("Cancel event failed", err);
      const apiError =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to cancel event";
      toast({
        title: "Error",
        description: apiError,
        variant: "destructive",
      });
      throw err; // Re-throw to let modal handle the error state
    } finally {
      setCancelling(false);
    }
  };

  const handleSettle = async () => {
    if (!request) return;
    setSettling(true);
    try {
      const response = await completeEvent(request.id);
      toast({
        title: "Event Completed",
        description:
          response.message ||
          `Event ${request.name || request.id} has been completed successfully.`,
      });
      // Mark as settled and refetch the event data
      setIsEventSettled(true);
      const updatedData = await getEventById(params.id);
      setRequest(updatedData);
    } catch (err: any) {
      console.error("Complete event failed", err);
      toast({
        title: "Error",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to complete event",
        variant: "destructive",
      });
    } finally {
      setSettling(false);
    }
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Filtered feedbacks by rating
  const filteredFeedbacks =
    ratingFilter === "all"
      ? feedbacks
      : feedbacks.filter((fb) => fb.rating === parseInt(ratingFilter));

  // Average rating
  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
        ).toFixed(1)
      : "0.0";

  // Rating counts
  const ratingCounts = {
    5: feedbacks.filter((fb) => fb.rating === 5).length,
    4: feedbacks.filter((fb) => fb.rating === 4).length,
    3: feedbacks.filter((fb) => fb.rating === 3).length,
    2: feedbacks.filter((fb) => fb.rating === 2).length,
    1: feedbacks.filter((fb) => fb.rating === 1).length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE);
  const startIndex = (currentPage - 1) * FEEDBACKS_PER_PAGE;
  const endIndex = startIndex + FEEDBACKS_PER_PAGE;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/uni-staff/events-req">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event Requests
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">
                {request.name || request.eventName}
              </h1>
              <p className="text-muted-foreground">
                Event Organization Request Details
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* prefer status, fallback to type */}
              {getStatusBadge(effectiveStatus)}
              {effectiveStatus === "PENDING_UNISTAFF" && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowApproveModal(true)}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleReject}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Event Name
                    </label>
                    <p className="text-lg font-semibold">
                      {request.name || request.eventName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {request.type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Event Type
                        </label>
                        <div className="mt-1">
                          {renderTypeBadge(request.type)}
                        </div>
                      </div>
                    )}
                    {(request.category ||
                      request.majorName ||
                      request.hostClub?.majorName) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Major Name
                        </label>
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className="max-w-[160px] truncate"
                            style={{
                              backgroundColor: getMajorColor(
                                request.majorName ||
                                  request.category ||
                                  request.hostClub?.majorName
                              ),
                              color: getContrastTextColor(
                                getMajorColor(
                                  request.majorName ||
                                    request.category ||
                                    request.hostClub?.majorName
                                )
                              ),
                            }}
                          >
                            {request.majorName ||
                              request.category ||
                              request.hostClub?.majorName}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="mt-1">{request.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Date & Time
                    </label>
                    <EventDateTimeDisplay event={request} variant="detailed" />
                  </div>

                  {/* Commit Point Cost */}
                  {request.commitPointCost !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Commit Point
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Ticket className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold text-emerald-600">
                          {request.commitPointCost} points
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Venue
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {request.locationName ? (
                          request.locationName
                        ) : (
                          <>
                            {locationLoading && "Loading location..."}
                            {locationError &&
                              `Location #${request.locationId} (failed to load)`}
                            {!locationLoading &&
                              !locationError &&
                              location &&
                              (location.name || location.locationName) && (
                                <>
                                  {location.name || location.locationName} (#
                                  {location.id ?? request.locationId})
                                </>
                              )}
                            {!locationLoading &&
                              !locationError &&
                              !location &&
                              (request.locationId
                                ? `Location #${request.locationId}`
                                : request.venue)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {request.expectedAttendees !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Expected Attendees
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {request.expectedAttendees} people
                          </span>
                        </div>
                      </div>
                    )}
                    {request.budget !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Budget
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {request.budget
                              ? formatCurrency(request.budget)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-in Capacity - only show if available */}
                  {request.maxCheckInCount !== undefined &&
                    request.currentCheckInCount !== undefined && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Max Capacity
                            </div>
                            <div className="font-semibold text-lg">
                              {request.maxCheckInCount} people
                            </div>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Current Check-ins
                            </div>
                            <div className="font-semibold text-lg">
                              {request.status === "APPROVED" ||
                              request.status === "ONGOING" ||
                              request.status === "COMPLETED"
                                ? summaryLoading
                                  ? "Loading..."
                                  : eventSummary
                                  ? request.type === "PUBLIC"
                                    ? `${eventSummary.checkedInCount} / ${request.maxCheckInCount}`
                                    : `${eventSummary.checkedInCount} / ${eventSummary.totalRegistered}`
                                  : `${request.currentCheckInCount} / ${request.maxCheckInCount}`
                                : `${request.currentCheckInCount} / ${request.maxCheckInCount}`}
                            </div>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Available Spots
                            </div>
                            <div className="font-semibold text-lg">
                              {(request.status === "APPROVED" ||
                                request.status === "ONGOING" ||
                                request.status === "COMPLETED") &&
                              eventSummary
                                ? request.type === "PUBLIC"
                                  ? `${
                                      request.maxCheckInCount -
                                      eventSummary.checkedInCount
                                    } remaining`
                                  : `${
                                      request.maxCheckInCount -
                                      eventSummary.totalRegistered
                                    } remaining`
                                : `${
                                    request.maxCheckInCount -
                                    request.currentCheckInCount
                                  } remaining`}
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm text-green-700 font-medium">
                                Budget Points
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-100"
                                onClick={() => setShowWalletHistoryModal(true)}
                              >
                                History
                              </Button>
                            </div>
                            <div className="font-semibold text-lg text-green-800">
                              {request.budgetPoints || 0} points
                            </div>
                          </div>
                        </div>

                        {/* Event Summary - Only shown when APPROVED, ONGOING or COMPLETED */}
                        {(request.status === "APPROVED" ||
                          request.status === "ONGOING" ||
                          request.status === "COMPLETED") &&
                          eventSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-sm text-blue-700 font-medium">
                                    {request.type === "PUBLIC" ? "Total Check-ins" : "Total Registrations"}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-medium shadow-sm hover:shadow transition-all"
                                      onClick={() => setShowAttendeeListModal(true)}
                                    >
                                      Lists
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={request.type === "PUBLIC"}
                                      className="h-6 px-2 text-xs bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      onClick={() => request.type !== "PUBLIC" && setShowRegistrationListModal(true)}
                                      title={request.type === "PUBLIC" ? "Public events do not have registrations" : ""}
                                    >
                                      Register Lists
                                    </Button>
                                  </div>
                                </div>
                                <div className="font-semibold text-lg text-blue-800">
                                  {summaryLoading ? (
                                    <span className="text-muted-foreground">
                                      Loading...
                                    </span>
                                  ) : request.type === "PUBLIC" ? (
                                    `${request.maxCheckInCount} ${request.type === "PUBLIC" ? "checked in" : "registered"}`
                                  ) : (
                                    `${eventSummary.totalRegistered} registered`
                                  )}
                                </div>
                              </div>
                              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <div className="text-sm text-amber-700 font-medium">
                                  Refunded
                                </div>
                                <div className="font-semibold text-lg text-amber-800">
                                  {summaryLoading ? (
                                    <span className="text-muted-foreground">
                                      Loading...
                                    </span>
                                  ) : (
                                    `${eventSummary.refundedCount} refunds`
                                  )}
                                </div>
                              </div>
                              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                                <div className="text-sm text-purple-700 font-medium">
                                  Total Commit Points
                                </div>
                                <div className="font-semibold text-lg text-purple-800">
                                  {summaryLoading ? (
                                    <span className="text-muted-foreground">
                                      Loading...
                                    </span>
                                  ) : (
                                    `${eventSummary.totalCommitPoints} points`
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </>
                    )}

                  {/* Co-hosted Clubs */}
                  {request.coHostedClubs &&
                    request.coHostedClubs.length > 0 && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-muted-foreground">
                          Co-hosting Clubs
                        </label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {request.coHostedClubs.map((club: any) => (
                            <div
                              key={club.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{club.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  (#{club.id})
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  club.coHostStatus === "APPROVED"
                                    ? "bg-green-100 text-green-700 border-green-500"
                                    : club.coHostStatus === "REJECTED"
                                    ? "bg-red-100 text-red-700 border-red-500"
                                    : club.coHostStatus === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-500"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                }
                              >
                                {club.coHostStatus}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {(request.purpose || request.description) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Purpose & Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">
                      {request.purpose || request.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(request.requestDate || getEventDateString(request)) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Request Date
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {request.requestDate 
                            ? new Date(request.requestDate).toLocaleDateString()
                            : formatEventDateTime(request)
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Organizing Club
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {request.hostClub ? (
                          <>
                            {request.hostClub.name} (#{request.hostClub.id})
                          </>
                        ) : (
                          <>
                            {clubLoading && "Loading club..."}
                            {clubError &&
                              `Club #${
                                request.clubId ?? request.requestedByClubId
                              } (failed to load)`}
                            {!clubLoading &&
                              !clubError &&
                              club &&
                              (club.name || club.clubName) && (
                                <>
                                  {club.name || club.clubName} (#
                                  {club.id ?? request.clubId})
                                </>
                              )}
                            {!clubLoading &&
                              !clubError &&
                              !club &&
                              (request.requestedBy ??
                                (request.clubId
                                  ? `Club #${request.clubId}`
                                  : "-"))}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {request.requestedByContact && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Person
                      </label>
                      <p className="font-semibold mt-1">
                        {request.requestedByContact}
                      </p>
                    </div>
                  )}

                  {(request.requestedByEmail || request.email) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Email
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${
                            request.requestedByEmail || request.email
                          }`}
                          className="text-blue-600 hover:underline"
                        >
                          {request.requestedByEmail || request.email}
                        </a>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Current Status
                    </label>
                    <div className="mt-2">
                      {getStatusBadge(request.status || request.type)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {effectiveStatus === "COMPLETED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Settlement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEventSettled ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          This event has already been settled.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">
                        This event has been completed. Click the button below to
                        process the final settlement.
                      </p>
                    )}
                    <Button
                      className={`w-full ${
                        isEventSettled
                          ? "bg-gray-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      variant="default"
                      onClick={handleSettle}
                      disabled={settling || isEventSettled || checkingSettled}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {checkingSettled
                        ? "Checking Status..."
                        : settling
                        ? "Processing Settlement..."
                        : isEventSettled
                        ? "Already Settled"
                        : "Settle Event"}
                    </Button>
                    
                  </CardContent>
                </Card>
              )}
              {effectiveStatus === "APPROVED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancelling}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Event
                    </Button>
                    
                  </CardContent>
                </Card>
              )}
              {effectiveStatus === "ONGOING" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      variant="default"
                      onClick={handleSettle}
                      disabled={settling || isEventSettled}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {settling
                        ? "Processing Settlement..."
                        : isEventSettled
                        ? "Already Settled"
                        : "Settle Event"}
                    </Button>
                    
                  </CardContent>
                </Card>
              )}
              {effectiveStatus === "PENDING_UNISTAFF" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => setShowApproveModal(true)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processing ? "Processing..." : "Reject Request"}
                    </Button>
                    
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Feedback Section - show for ALL statuses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Event Feedback
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        See what participants thought about this event
                      </p>
                    </div>
                    {feedbacks.length > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                          <span className="text-3xl font-bold">
                            {averageRating}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feedbacks.length}{" "}
                          {feedbacks.length === 1 ? "review" : "reviews"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {feedbackLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Loading feedback...
                      </span>
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        No feedback available for this event yet.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Rating Filter */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Filter className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Filter by rating:
                          </span>
                          <Select
                            value={ratingFilter}
                            onValueChange={setRatingFilter}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="All ratings" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                All ratings ({feedbacks.length})
                              </SelectItem>
                              <SelectItem value="5">
                                5 stars ({ratingCounts[5]})
                              </SelectItem>
                              <SelectItem value="4">
                                4 stars ({ratingCounts[4]})
                              </SelectItem>
                              <SelectItem value="3">
                                3 stars ({ratingCounts[3]})
                              </SelectItem>
                              <SelectItem value="2">
                                2 stars ({ratingCounts[2]})
                              </SelectItem>
                              <SelectItem value="1">
                                1 star ({ratingCounts[1]})
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Showing {filteredFeedbacks.length} of{" "}
                          {feedbacks.length}{" "}
                          {feedbacks.length === 1 ? "feedback" : "feedbacks"}
                        </div>
                      </div>

                      <Separator />

                      {/* Feedback List */}
                      {filteredFeedbacks.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">
                            No feedback found for the selected rating.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {paginatedFeedbacks.map((feedback) => (
                              <div
                                key={feedback.feedbackId}
                                className="p-4 bg-muted/30 rounded-lg border border-muted hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {feedback.memberName ||
                                          `Member #${feedback.membershipId}`}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {new Date(
                                          feedback.createdAt
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  {renderStars(feedback.rating)}
                                </div>
                                <p className="text-sm leading-relaxed pl-13">
                                  {feedback.comment}
                                </p>
                                {feedback.updatedAt && (
                                  <div className="text-xs text-muted-foreground mt-2 pl-13">
                                    Updated:{" "}
                                    {new Date(
                                      feedback.updatedAt
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1}-
                                {Math.min(endIndex, filteredFeedbacks.length)}{" "}
                                of {filteredFeedbacks.length}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(1, prev - 1)
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />
                                  Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                  ).map((page) => (
                                    <Button
                                      key={page}
                                      variant={
                                        currentPage === page
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="min-w-[40px]"
                                    >
                                      {page}
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(totalPages, prev + 1)
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">{/* keep sidebar gap alignment */}</div>
          </div>

          {/* Wallet History Modal */}
          <EventWalletHistoryModal
            open={showWalletHistoryModal}
            onOpenChange={setShowWalletHistoryModal}
            eventId={params.id}
          />

          {/* Reject Modal */}
          <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reason for Rejection</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="rejectReason" className="text-muted-foreground">
                  Please provide a reason for rejecting this event.
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Type your reason here..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="mt-2 border-slate-300"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleConfirmReject()} // Sẽ tạo hàm này ở bước 5
                  disabled={processing || !rejectReason.trim()} // Vô hiệu hóa nếu đang xử lý hoặc lý do trống
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm Reject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Approve Budget Modal */}
          {request && (
            <ApproveBudgetModal
              open={showApproveModal}
              onOpenChange={setShowApproveModal}
              eventId={request.id}
              hostClubId={request.hostClub?.id || request.clubId}
              hostClubName={
                request.hostClub?.name || club?.name || club?.clubName
              }
              defaultRequestPoints={request.budgetPoints || 0}
              commitPointCost={request.commitPointCost || 0}
              maxCheckInCount={request.maxCheckInCount || 0}
              eventType={request.type || request.eventType}
              onApproved={(approvedBudgetPoints) => {
                setRequest((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        status: "APPROVED",
                        budgetPoints: approvedBudgetPoints,
                      }
                    : prev
                );
              }}
            />
          )}

          {/* Cancel Event Modal */}
          {request && (
            <CancelEventModal
              open={showCancelModal}
              onOpenChange={setShowCancelModal}
              onConfirm={handleConfirmCancel}
              eventName={request.name || request.eventName || ""}
              isLoading={cancelling}
            />
          )}

          {/* Attendee List Modal */}
          {request && (
            <AttendeeListModal
              isOpen={showAttendeeListModal}
              onClose={() => setShowAttendeeListModal(false)}
              eventId={request.id}
              eventName={request.name || request.eventName}
            />
          )}

          {/* Registration List Modal */}
          {request && (
            <RegistrationListModal
              isOpen={showRegistrationListModal}
              onClose={() => setShowRegistrationListModal(false)}
              eventId={request.id}
              eventName={request.name || request.eventName}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
