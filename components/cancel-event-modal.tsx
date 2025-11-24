"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CancelEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  eventName: string;
  isLoading?: boolean;
}

export function CancelEventModal({
  open,
  onOpenChange,
  onConfirm,
  eventName,
  isLoading = false,
}: CancelEventModalProps) {
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Cancel Event</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 !text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              Warning: Critical Action
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">
              You are about to cancel the event:
            </p>
            <p className="text-base font-bold text-gray-900 bg-gray-100 p-3 rounded-md border border-gray-200">
              "{eventName}"
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                Cancelling this event will:
              </p>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Cancel all budget points</strong> allocated in the event wallet
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Invalidate all event data</strong> including registrations and check-ins
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Remove all event statistics</strong> and related records
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Permanently mark the event as cancelled</strong>
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Are you sure you want to proceed?
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing || isLoading}
            className="w-full sm:w-auto"
          >
            Keep Event
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={processing || isLoading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          >
            {processing || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Yes, Cancel Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
