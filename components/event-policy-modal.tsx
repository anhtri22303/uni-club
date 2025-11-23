"use client";

import { Modal } from "@/components/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trophy, AlertCircle, Info, Dot } from "lucide-react";
import eventPolicies from "@/src/data/event-policies.json";
import { cn } from "@/lib/utils";

interface EventPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function EventPolicyModal({
  open,
  onOpenChange,
  onAccept,
}: EventPolicyModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Event Commit Point Policy"
      description="Please review these policies carefully before continuing."
      className="w-[95vw] sm:max-w-[640px] max-h-[90vh] sm:max-h-[85vh]"
      zIndex={150}
    >
      {/* Decorative Bar */}
      <div className="h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 -mx-6 -mt-2" />

      {/* Scrollable Content */}
      <ScrollArea className="max-h-[calc(90vh-280px)] sm:max-h-[calc(85vh-260px)] pr-4">
        <div className="space-y-6 py-4">
          {/* Top Notice */}
          <div className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 shadow-sm">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed text-blue-900">
                These policies are applied to ensure fairness and a high-quality
                experience for all participants.
              </p>
            </div>
          </div>

          {/* Sections */}
          {eventPolicies.sections.map((section, i) => (
            <div key={i} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 border border-indigo-300 text-indigo-700 shadow-sm">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  {section.heading}
                </h3>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {section.items.map((item, j) => (
                  <div
                    key={j}
                    className={cn(
                      "rounded-xl p-4 shadow-sm border",
                      item.important
                        ? "bg-amber-50 border-amber-300"
                        : "bg-slate-100 border-slate-300"
                    )}
                  >
                    <div className="flex gap-3">
                      {item.important ? (
                        <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                      ) : (
                        <div className="mt-1 shrink-0">
                          <div className="h-2 w-2 rounded-full bg-slate-500" />
                        </div>
                      )}

                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          item.important
                            ? "text-amber-900 font-medium"
                            : "text-slate-800"
                        )}
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer Notice */}
          {eventPolicies.footer && (
            <div className="rounded-lg border border-slate-300 bg-slate-100 p-4 text-center shadow-sm">
              <p className="text-xs text-slate-600 italic">
                {eventPolicies.footer.text}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 mt-4 border-t">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Close
        </Button>

        <Button
          onClick={() => {
            onAccept();
            onOpenChange(false);
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md"
        >
          I Understand & Accept
        </Button>
      </div>
    </Modal>
  );
}
