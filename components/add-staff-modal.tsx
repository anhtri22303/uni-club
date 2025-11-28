"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  UserPlus,
  Users,
  UserCheck,
  Star,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMembersByClubId, ApiMembership } from "@/service/membershipApi";
import {
  postEventStaff,
  getEventStaff,
  deleteEventStaff,
  EventStaff,
  getEvaluateEventStaff,
  StaffEvaluation,
  getTopEvaluatedStaff,
} from "@/service/eventStaffApi";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import EvaluateStaffModal from "./evaluate-staff-modal";
import EvaluationDetailModal from "./evaluation-detail-modal";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  clubId: number;
  eventStatus: string;
}

type TabType = "staff-list" | "add-staff";

export default function AddStaffModal({
  isOpen,
  onClose,
  eventId,
  clubId,
  eventStatus,
}: AddStaffModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("staff-list");

  // Event Staff states
  const [eventStaff, setEventStaff] = useState<EventStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Members states
  const [members, setMembers] = useState<ApiMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addingStaff, setAddingStaff] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dutyInput, setDutyInput] = useState<{ [key: number]: string }>({});

  // Evaluation modal state
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [selectedStaffForEvaluation, setSelectedStaffForEvaluation] =
    useState<EventStaff | null>(null);

  // Evaluation detail modal state
  const [showEvaluationDetailModal, setShowEvaluationDetailModal] =
    useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<StaffEvaluation | null>(null);

  // Staff evaluations state
  const [staffEvaluations, setStaffEvaluations] = useState<StaffEvaluation[]>(
    []
  );
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);
  const [topEvaluations, setTopEvaluations] = useState<StaffEvaluation[]>([]);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<EventStaff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if event is completed
  const isEventCompleted = eventStatus === "COMPLETED";

  useEffect(() => {
    if (isOpen && activeTab === "staff-list") {
      loadEventStaff();
    }
  }, [isOpen, activeTab, eventId]);

  useEffect(() => {
    if (isOpen && activeTab === "add-staff") {
      loadMembers();
    }
  }, [isOpen, activeTab, clubId]);

  const loadEventStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await getEventStaff(eventId);
      setEventStaff(data);

      // If event is completed, also load evaluations and top evaluations
      if (isEventCompleted) {
        await Promise.all([loadEvaluations(), loadTopEvaluations()]);
      }
    } catch (error: any) {
      console.error("Failed to load event staff:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to load event staff",
        variant: "destructive",
      });
    } finally {
      setStaffLoading(false);
    }
  };

  const loadEvaluations = async () => {
    setEvaluationsLoading(true);
    try {
      const data = await getEvaluateEventStaff(eventId);
      setStaffEvaluations(data);
    } catch (error: any) {
      console.error("Failed to load evaluations:", error);
      // Don't show error toast, it's not critical
    } finally {
      setEvaluationsLoading(false);
    }
  };

  const loadTopEvaluations = async () => {
    try {
      const data = await getTopEvaluatedStaff(eventId);
      setTopEvaluations(data);
    } catch (error: any) {
      console.error("Failed to load top evaluations:", error);
      // Don't show error toast, it's not critical
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const data = await getMembersByClubId(clubId);
      // Filter only members with "MEMBER" role and ACTIVE state
      const filteredMembers = data.filter(
        (member) => member.clubRole === "MEMBER" && member.state === "ACTIVE"
      );
      setMembers(filteredMembers);
    } catch (error: any) {
      console.error("Failed to load members:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddStaff = async (membershipId: number) => {
    const duty = dutyInput[membershipId]?.trim();

    if (!duty) {
      toast({
        title: "Error",
        description: "Please enter a duty for this member",
        variant: "destructive",
      });
      return;
    }

    setAddingStaff(membershipId);
    try {
      await postEventStaff(eventId, membershipId, duty);
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      // Clear duty input for this member
      setDutyInput((prev) => {
        const newInputs = { ...prev };
        delete newInputs[membershipId];
        return newInputs;
      });
      // Reload both lists after successful addition
      await Promise.all([loadMembers(), loadEventStaff()]);
    } catch (error: any) {
      console.error("Failed to add staff:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setAddingStaff(null);
    }
  };

  const handleDutyChange = (membershipId: number, value: string) => {
    setDutyInput((prev) => ({
      ...prev,
      [membershipId]: value,
    }));
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const handleOpenEvaluateModal = (staff: EventStaff) => {
    setSelectedStaffForEvaluation(staff);
    setShowEvaluateModal(true);
  };

  const handleCloseEvaluateModal = () => {
    setShowEvaluateModal(false);
    setSelectedStaffForEvaluation(null);
  };

  const handleEvaluationSuccess = async () => {
    // Reload staff list and evaluations after successful evaluation
    await loadEventStaff();
  };

  const getStaffEvaluation = (
    membershipId: number
  ): StaffEvaluation | undefined => {
    return staffEvaluations.find(
      (evaluation) => evaluation.membershipId === membershipId
    );
  };

  const handleOpenEvaluationDetail = (staff: EventStaff) => {
    const evaluation = getStaffEvaluation(staff.membershipId);
    if (evaluation) {
      setSelectedEvaluation(evaluation);
      setShowEvaluationDetailModal(true);
    }
  };

  const handleCloseEvaluationDetail = () => {
    setShowEvaluationDetailModal(false);
    setSelectedEvaluation(null);
  };

  const handleOpenDeleteConfirm = (staff: EventStaff) => {
    setStaffToDelete(staff);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    setIsDeleting(true);
    try {
      await deleteEventStaff(eventId, staffToDelete.id);
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
      
      // Reload staff list
      await loadEventStaff();
      
      // Close delete confirmation modal
      handleCloseDeleteConfirm();
    } catch (error: any) {
      console.error("Failed to delete staff:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to remove staff member",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    // Exclude members who are already assigned as event staff (only ACTIVE staff)
    const isAlreadyStaff = eventStaff.some(
      (staff) => staff.membershipId === member.membershipId && staff.state === "ACTIVE"
    );

    if (isAlreadyStaff) return false;

    // Filter by search query
    return (
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredStaff = eventStaff
    .filter((staff) => staff.state !== "REMOVED") // Exclude REMOVED staff
    .filter(
      (staff) =>
        staff.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.duty.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Sort staff by performance if event is completed and top evaluations are available
  const sortedFilteredStaff =
    isEventCompleted && topEvaluations.length > 0
      ? [...filteredStaff].sort((a, b) => {
          const evalA = topEvaluations.find(
            (e) => e.membershipId === a.membershipId
          );
          const evalB = topEvaluations.find(
            (e) => e.membershipId === b.membershipId
          );

          // Performance order: EXCELLENT > GOOD > AVERAGE > POOR
          const performanceOrder = {
            EXCELLENT: 4,
            GOOD: 3,
            AVERAGE: 2,
            POOR: 1,
          };
          const scoreA = evalA ? performanceOrder[evalA.performance] || 0 : 0;
          const scoreB = evalB ? performanceOrder[evalB.performance] || 0 : 0;

          return scoreB - scoreA; // Descending order
        })
      : filteredStaff;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Event Staff Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        {isEventCompleted ? (
          // Only show Event Staff tab for completed events
          <div className="flex border-b dark:border-gray-700">
            <div className="flex-1 px-6 py-4 text-sm font-medium border-b-2 border-purple-600 text-purple-600 dark:text-purple-400">
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>Event Staff</span>
              </div>
            </div>
          </div>
        ) : (
          // Show both tabs for non-completed events
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => handleTabChange("staff-list")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "staff-list"
                  ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>Event Staff </span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange("add-staff")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "add-staff"
                  ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Add Staff</span>
              </div>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-6 border-b dark:border-gray-700">
          <Input
            type="text"
            placeholder={
              activeTab === "staff-list"
                ? "Search by member name or duty..."
                : "Search by name, student code, or email..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEventCompleted || activeTab === "staff-list" ? (
            // Event Staff List Tab
            staffLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : sortedFilteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? "No staff found matching your search"
                    : "No staff assigned to this event yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedFilteredStaff.map((staff) => {
                  const staffEvaluation = getStaffEvaluation(
                    staff.membershipId
                  );

                  return (
                    <div
                      key={staff.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* Avatar Placeholder */}
                      <div className="shrink-0">
                        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {staff.memberName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Staff Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {staff.memberName}
                          </h3>
                          {/* Show performance badge for completed events */}
                          {isEventCompleted && staffEvaluation && (
                            <Badge
                              variant="outline"
                              className={
                                staffEvaluation.performance === "EXCELLENT"
                                  ? "bg-green-100 text-green-700 border-green-500"
                                  : staffEvaluation.performance === "GOOD"
                                  ? "bg-blue-100 text-blue-700 border-blue-500"
                                  : staffEvaluation.performance === "AVERAGE"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-500"
                                  : "bg-red-100 text-red-700 border-red-500"
                              }
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {staffEvaluation.performance}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Duty: {staff.duty}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Assigned:{" "}
                          {new Date(staff.assignedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={
                          staff.state === "ACTIVE"
                            ? "bg-green-100 text-green-700 border-green-500"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }
                      >
                        {staff.state}
                      </Badge>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Delete Button - Only show if event is not completed */}
                        {!isEventCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteConfirm(staff)}
                            className="shrink-0 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Evaluate Button - Only show for completed events */}
                        {isEventCompleted &&
                          (() => {
                            const evaluation = getStaffEvaluation(
                              staff.membershipId
                            );
                            if (evaluation) {
                              return (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleOpenEvaluationDetail(staff)
                                  }
                                  className="shrink-0 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Has Been Evaluated
                                </Button>
                              );
                            }
                            return (
                              <Button
                                size="sm"
                                onClick={() => handleOpenEvaluateModal(staff)}
                                className="shrink-0 bg-amber-600 hover:bg-amber-700"
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Evaluate
                              </Button>
                            );
                          })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : // Add Staff Tab
          membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "No members found matching your search"
                  : "No members available to add as staff"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.membershipId}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {member.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {member.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.studentCode} • {member.email}
                    </p>
                    {member.major && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.major}
                      </p>
                    )}
                  </div>

                  {/* Duty Input */}
                  <div className="w-48">
                    <Input
                      type="text"
                      placeholder="Enter duty..."
                      value={dutyInput[member.membershipId] || ""}
                      onChange={(e) =>
                        handleDutyChange(member.membershipId, e.target.value)
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={() => handleAddStaff(member.membershipId)}
                    disabled={
                      addingStaff === member.membershipId ||
                      !dutyInput[member.membershipId]?.trim()
                    }
                    className="shrink-0"
                  >
                    {addingStaff === member.membershipId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Evaluate Staff Modal */}
      {selectedStaffForEvaluation && (
        <EvaluateStaffModal
          isOpen={showEvaluateModal}
          onClose={handleCloseEvaluateModal}
          staff={selectedStaffForEvaluation}
          onSuccess={handleEvaluationSuccess}
        />
      )}

      {/* Evaluation Detail Modal */}
      <EvaluationDetailModal
        open={showEvaluationDetailModal}
        onClose={handleCloseEvaluationDetail}
        evaluation={selectedEvaluation}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && staffToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Remove Staff Member
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {staffToDelete.memberName}
                </span>{" "}
                from this event? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleCloseDeleteConfirm}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
