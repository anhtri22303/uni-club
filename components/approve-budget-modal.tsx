"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Users, MapPin, Calendar, Award } from "lucide-react";
import { putEventStatus } from "@/service/eventApi";
import { useToast } from "@/hooks/use-toast";

// Công thức tính điểm ngân sách
const getBudgetCalculationPolicies = (
  commitPointCost: number,
  maxCheckInCount: number,
  suggestedBudget: number,
  isPublicOrDefault: boolean
) => [
  {
    icon: Info,
    title: "Budget Calculation Formula",
    items: [
      {
        label: isPublicOrDefault ? "Reward Point for Each Check-in" : "Commit Point Cost",
        points: isPublicOrDefault
          ? `${commitPointCost} pts (default for PUBLIC events)`
          : `${commitPointCost} pts`,
      },
      {
        label: "Max Check-in Count",
        points: `${maxCheckInCount} attendees`,
      },
      {
        label: "Budget Formula",
        points: isPublicOrDefault
          ? "Reward Point for Each Check-in × Max Check-in Count"
          : "Commit Point Cost × Max Check-in Count × 2",
      },
      {
        label: "Suggested Budget",
        points: `${suggestedBudget.toLocaleString()} pts`,
      },
    ],
  },
];

type ApproveBudgetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  hostClubId: number;
  hostClubName?: string;
  defaultRequestPoints?: number;
  commitPointCost?: number;
  maxCheckInCount?: number;
  eventType?: string; // Thêm eventType để kiểm tra PUBLIC
  onApproved?: (approvedBudgetPoints: number) => void;
};

export function ApproveBudgetModal(props: ApproveBudgetModalProps) {
  const {
    open,
    onOpenChange,
    eventId,
    hostClubId,
    hostClubName,
    defaultRequestPoints = 0,
    commitPointCost = 0,
    maxCheckInCount = 0,
    eventType,
    onApproved,
  } = props;
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [approvedPointsInput, setApprovedPointsInput] = useState<string>(() =>
    String(defaultRequestPoints || 0)
  );
  const [policyChecked, setPolicyChecked] = useState(false);

  // Logic: Nếu event là PUBLIC hoặc commitPointCost = 0 thì mặc định = 100
  const effectiveCommitPointCost = useMemo(() => {
    if (eventType?.toUpperCase() === "PUBLIC" || commitPointCost === 0) {
      return 50;
    }
    return commitPointCost;
  }, [eventType, commitPointCost]);

  // Tính suggested budget: PUBLIC events không nhân x2, các event khác nhân x2
  const suggestedBudget = useMemo(() => {
    const isPublicEvent = eventType?.toUpperCase() === "PUBLIC" || commitPointCost === 0;
    if (isPublicEvent) {
      // PUBLIC: Commit Point × Max Check-in Count (không x2)
      return effectiveCommitPointCost * maxCheckInCount;
    }
    // PRIVATE/SPECIAL: Commit Point × Max Check-in Count × 2
    return effectiveCommitPointCost * maxCheckInCount * 2;
  }, [effectiveCommitPointCost, maxCheckInCount, eventType, commitPointCost]);

  // Tạo policies động dựa trên dữ liệu thực tế
  const budgetPolicies = useMemo(
    () =>
      getBudgetCalculationPolicies(
        effectiveCommitPointCost,
        maxCheckInCount,
        suggestedBudget,
        eventType?.toUpperCase() === "PUBLIC" || commitPointCost === 0
      ),
    [effectiveCommitPointCost, maxCheckInCount, suggestedBudget, eventType, commitPointCost]
  );

  useEffect(() => {
    if (!open) return;
    setApprovedPointsInput(defaultRequestPoints ? String(defaultRequestPoints) : "");
    // Debug: Kiểm tra dữ liệu nhận được
    const isPublic = eventType?.toUpperCase() === "PUBLIC" || commitPointCost === 0;
    const effectiveCommit = isPublic ? 100 : commitPointCost;
    const calculatedBudget = isPublic 
      ? effectiveCommit * maxCheckInCount 
      : effectiveCommit * maxCheckInCount * 2;
    console.log("  Modal Debug:", {
      eventType,
      originalCommitPointCost: commitPointCost,
      effectiveCommitPointCost: effectiveCommit,
      maxCheckInCount,
      isPublicEvent: isPublic,
      suggestedBudget: calculatedBudget,
    });
  }, [open, defaultRequestPoints, commitPointCost, maxCheckInCount, eventType]);

  const approvedPoints = useMemo(() => {
    const n = Number(approvedPointsInput);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [approvedPointsInput]);

  // Kiểm tra validation - chỉ cần không để trống và là số dương
  const isValidBudget = useMemo(() => {
    if (approvedPointsInput === "") return false; // Không được để trống
    return approvedPoints > 0; // Chỉ cần là số dương
  }, [approvedPoints, approvedPointsInput]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await putEventStatus(eventId, approvedPoints);
      toast({
        title: "Approved",
        description: `Approved ${approvedPoints.toLocaleString()} pts for ${
          hostClubName || "club"
        }`,
      });
      onApproved?.(approvedPoints);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Approval failed",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Could not approve budget",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Event Budget</DialogTitle>
          <DialogDescription>
            Set approved points for the event. Club:{" "}
            {hostClubName || `#${hostClubId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Approval form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="approvedPoints"
                className="text-base font-semibold"
              >
                Approved Budget Points
              </Label>
              {/* Hiển thị Suggested Budget */}
              <div className="flex gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Suggested Budget:
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {suggestedBudget > 0 ? `${suggestedBudget.toLocaleString()} pts` : "N/A"}
                  </span>
                </div>
              </div>
              <Input
                id="approvedPoints"
                value={approvedPointsInput}
                onChange={(e) => {
                  let v = e.target.value;
                  // Xóa số 0 đầu nếu có
                  if (/^0+\d+/.test(v)) {
                    v = v.replace(/^0+/, "");
                  }
                  if (v === "" || /^\d+$/.test(v)) {
                    setApprovedPointsInput(v);
                  }
                }}
                inputMode="numeric"
                placeholder={
                  suggestedBudget > 0
                    ? `Suggested: ${suggestedBudget}`
                    : "Enter budget points"
                }
                className={`text-lg h-12 ${
                  !isValidBudget && approvedPointsInput
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                style={{
                  color: approvedPointsInput ? undefined : "#cbd5e1",
                }}
              />
              {!isValidBudget && approvedPointsInput && (
                <p className="text-sm text-red-600">
                  Budget must be a positive number
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter the approved budget points for this event
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={
                  submitting ||
                  approvedPointsInput === "" ||
                  !policyChecked ||
                  !isValidBudget
                }
              >
                {submitting ? "Approving..." : "Approve Budget"}
              </Button>
            </div>
          </div>

          {/* Right side: Point allocation policy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-base">
                Point Allocation Guidelines
              </h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {budgetPolicies.map((policy, idx) => {
                const IconComponent = policy.icon;
                return (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        {policy.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <ul className="space-y-1.5">
                        {policy.items.map((item, itemIdx) => (
                          <li
                            key={itemIdx}
                            className="text-xs flex justify-between items-center"
                          >
                            <span className="text-muted-foreground">
                              {item.label}
                            </span>
                            <span className="font-semibold text-primary">
                              {item.points}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Checkbox xác nhận đã đọc */}
              <div className="flex items-center gap-2 mt-4 p-2 border rounded bg-muted">
                <Checkbox
                  id="policyChecked"
                  checked={policyChecked}
                  onCheckedChange={(val) => setPolicyChecked(val === true)}
                />
                <label
                  htmlFor="policyChecked"
                  className="text-xs select-none cursor-pointer"
                >
                  I confirm that I have read and understood the entire scoring
                  policy above.
                </label>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
