"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  XCircle,
  Loader2,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getEventById,
  timeObjectToString,
  getEventSummary,
  EventSummary,
  isMultiDayEvent,
  formatEventDateRange,
  getEventDurationDays,
  EventDay,
} from "@/service/eventApi";
import {
  getFeedbackByEventId,
  Feedback,
  postFeedback,
  getMyFeedbacks,
  putFeedback,
} from "@/service/feedbackApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbackModal } from "@/components/feedback-modal";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { renderTypeBadge } from "@/lib/eventUtils";

interface EventDetail {
  id: number;
  name: string;
  description: string;
  type: string;
  // Multi-day fields
  startDate?: string;
  endDate?: string;
  days?: EventDay[];
  // Legacy single-day fields
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  checkInCode: string;
  locationName: string;
  maxCheckInCount: number;
  currentCheckInCount: number;
  budgetPoints?: number;
  commitPointCost?: number;
  hostClub: {
    id: number;
    name: string;
    coHostStatus?: string;
  };
  coHostedClubs?: Array<{
    id: number;
    name: string;
    coHostStatus: string;
  }>;
  // Legacy fields for backward compatibility
  clubId?: number;
  time?: string;
  locationId?: number;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Event summary states
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const FEEDBACKS_PER_PAGE = 5;

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  const [myFeedbacksLoading, setMyFeedbacksLoading] = useState(false);
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(
    null
  );

  useEffect(() => {
    const loadEventDetail = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const data = await getEventById(params.id as string);
        // Normalize TimeObject to string for EventDetail type
        const normalizedEvent: EventDetail = {
          ...data,
          startTime: data.startTime ? timeObjectToString(data.startTime) : null,
          endTime: data.endTime ? timeObjectToString(data.endTime) : null,
        };
        setEvent(normalizedEvent);

        // Fetch event summary if APPROVED, ONGOING or COMPLETED
        if (
          data.status === "APPROVED" ||
          data.status === "ONGOING" ||
          data.status === "COMPLETED"
        ) {
          try {
            setSummaryLoading(true);
            const summaryData = await getEventSummary(params.id as string);
            setEventSummary(summaryData);
          } catch (summaryError) {
            console.error("Failed to load event summary:", summaryError);
            // Don't show error toast for summary, it's not critical
          } finally {
            setSummaryLoading(false);
          }
        }

        // Fetch feedback for APPROVED, ONGOING, COMPLETED events
        if (
          data.status === "APPROVED" ||
          data.status === "ONGOING" ||
          data.status === "COMPLETED"
        ) {
          try {
            setFeedbackLoading(true);
            const feedbackData = await getFeedbackByEventId(
              params.id as string
            );
            setFeedbacks(feedbackData);
          } catch (feedbackError) {
            console.error("Failed to load feedback:", feedbackError);
            // Don't show error toast for feedback, it's not critical
          } finally {
            setFeedbackLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to load event detail:", error);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [params.id, toast]);

  // Load current user's feedbacks to check if already submitted for this event
  useEffect(() => {
    const loadMyFeedbacks = async () => {
      try {
        setMyFeedbacksLoading(true);
        const data = await getMyFeedbacks();
        setMyFeedbacks(data);
      } catch (error) {
        console.error("Failed to load my feedbacks:", error);
        // Don't show error toast, not critical
      } finally {
        setMyFeedbacksLoading(false);
      }
    };

    loadMyFeedbacks();
  }, []);

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "PUBLIC" ? "default" : "secondary"}>
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
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

  // Filter feedbacks by rating
  const filteredFeedbacks =
    ratingFilter === "all"
      ? feedbacks
      : feedbacks.filter((fb) => fb.rating === parseInt(ratingFilter));

  // Calculate average rating
  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
        ).toFixed(1)
      : "0.0";

  // Count feedbacks by rating
  const ratingCounts = {
    5: feedbacks.filter((fb) => fb.rating === 5).length,
    4: feedbacks.filter((fb) => fb.rating === 4).length,
    3: feedbacks.filter((fb) => fb.rating === 3).length,
    2: feedbacks.filter((fb) => fb.rating === 2).length,
    1: feedbacks.filter((fb) => fb.rating === 1).length,
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE);
  const startIndex = (currentPage - 1) * FEEDBACKS_PER_PAGE;
  const endIndex = startIndex + FEEDBACKS_PER_PAGE;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter]);

  // Check if current user has already submitted feedback for this event
  const hasSubmittedFeedback = event
    ? myFeedbacks.some((fb) => fb.eventId === event.id)
    : false;

  // Get existing feedback for this event
  useEffect(() => {
    if (event && myFeedbacks.length > 0) {
      const feedback = myFeedbacks.find((fb) => fb.eventId === event.id);
      setExistingFeedback(feedback || null);
    }
  }, [event, myFeedbacks]);

  // Handle feedback submission
  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!event) return;

    try {
      setIsSubmittingFeedback(true);
      await postFeedback(event.id, { rating, comment });

      toast({
        title: "Success",
        description: "Your feedback has been submitted successfully!",
      });

      // Close modal
      setShowFeedbackModal(false);

      // Reload the page to show updated feedback
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle edit feedback
  const handleEditFeedback = () => {
    setShowEditFeedbackModal(true);
  };

  // Handle edit feedback submission
  const handleEditFeedbackSubmit = async (rating: number, comment: string) => {
    if (!existingFeedback) return;

    try {
      setIsSubmittingFeedback(true);
      await putFeedback(existingFeedback.feedbackId, { rating, comment });

      toast({
        title: "Success",
        description: "Your feedback has been updated successfully!",
      });

      // Close modal
      setShowEditFeedbackModal(false);

      // Reload the page to show updated feedback
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to update feedback:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to update feedback. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <LoadingSkeleton className="h-96" />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
                <p className="text-muted-foreground">
                  The event you're looking for doesn't exist.
                </p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {/* Show Feedback button for APPROVED, ONGOING, or COMPLETED events */}
              {event &&
                (event.status === "APPROVED" ||
                  event.status === "ONGOING" ||
                  event.status === "COMPLETED") && (
                  <>
                    {hasSubmittedFeedback ? (
                      <>
                        <Button
                          onClick={() => setShowFeedbackModal(true)}
                          disabled={true}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="You have already submitted feedback for this event"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Feedback Submitted
                        </Button>
                        <Button
                          onClick={handleEditFeedback}
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Edit Feedback
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setShowFeedbackModal(true)}
                        disabled={myFeedbacksLoading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Give feedback for this event"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Give Feedback
                      </Button>
                    )}
                  </>
                )}
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Event Details
                </span>
              </div>
            </div>
          </div>

          {/* Event Detail Card */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    {event.name}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {renderTypeBadge(event.type)}
                  </div>
                </div>
                {/* <div className="text-right">
                  <div className="text-sm text-muted-foreground">Event ID</div>
                  <div className="font-mono text-lg font-semibold">#{event.id}</div>
                </div> */}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              {event.description && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Event Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Date & Time</h3>
                  {isMultiDayEvent(event as any) ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {formatEventDateRange(event as any, "en-US")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getEventDurationDays(event as any)} day{getEventDurationDays(event as any) > 1 ? 's' : ''} event
                          </div>
                        </div>
                      </div>
                      
                      {/* Schedule for each day */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Event Schedule</h4>
                        {event.days?.map((day, index) => (
                          <div key={day.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-muted">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">D{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {new Date(day.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {day.startTime} - {day.endTime}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            {event.date && formatDate(event.date)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            {event.startTime && event.endTime
                              ? `${timeObjectToString(
                                  event.startTime
                                )} - ${timeObjectToString(event.endTime)}`
                              : event.time || "Time not set"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Event Duration
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Club */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Location & Organization
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{event.locationName}</div>
                        <div className="text-sm text-muted-foreground">
                          Event Venue
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{event.hostClub.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Organizing Club
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Check-in Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Check-in Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Max Capacity
                    </div>
                    <div className="font-semibold text-lg">
                      {event.maxCheckInCount} people
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Current Check-ins
                    </div>
                    <div className="font-semibold text-lg">
                      {event.currentCheckInCount} / {event.maxCheckInCount}
                    </div>
                  </div>
                  {event.type === "PUBLIC" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Available Spots
                      </div>
                      <div className="font-semibold text-lg">
                        {event.maxCheckInCount - event.currentCheckInCount}{" "}
                        remaining
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Co-hosted Clubs */}
              {event.coHostedClubs && event.coHostedClubs.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Co-hosting Clubs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {event.coHostedClubs.map((club) => (
                        <div
                          key={club.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{club.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Club ID: {club.id}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              club.coHostStatus === "APPROVED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {club.coHostStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Feedback Section - Show for APPROVED, ONGOING, COMPLETED */}
          {(event.status === "APPROVED" ||
            event.status === "ONGOING" ||
            event.status === "COMPLETED") && (
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
                        Showing {filteredFeedbacks.length} of {feedbacks.length}{" "}
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
                                      {event.status === "COMPLETED"
                                        ? "Anonymous"
                                        : feedback.memberName ||
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
                              {Math.min(endIndex, filteredFeedbacks.length)} of{" "}
                              {filteredFeedbacks.length}
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
          )}
        </div>

        {/* Feedback Modal */}
        {event && (
          <FeedbackModal
            open={showFeedbackModal}
            onOpenChange={setShowFeedbackModal}
            onSubmit={handleFeedbackSubmit}
            eventName={event.name}
            isSubmitting={isSubmittingFeedback}
          />
        )}

        {/* Edit Feedback Modal */}
        {event && existingFeedback && (
          <FeedbackModal
            open={showEditFeedbackModal}
            onOpenChange={setShowEditFeedbackModal}
            onSubmit={handleEditFeedbackSubmit}
            eventName={event.name}
            isSubmitting={isSubmittingFeedback}
            initialRating={existingFeedback.rating}
            initialComment={existingFeedback.comment}
            isEditMode={true}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
