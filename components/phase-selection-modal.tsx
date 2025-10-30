import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { QrCode } from "lucide-react"

interface PhaseSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (phase: string) => void
  isLoading?: boolean
}

export function PhaseSelectionModal({ open, onOpenChange, onConfirm, isLoading = false }: PhaseSelectionModalProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>("START")

  const handleConfirm = () => {
    onConfirm(selectedPhase)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Select Event Phase
          </DialogTitle>
          <DialogDescription>
            Choose the phase of the event for QR code generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label htmlFor="phase-select" className="text-base font-semibold">
              Event Phase
            </Label>
            <Select 
              value={selectedPhase} 
              onValueChange={setSelectedPhase}
              disabled={isLoading}
            >
              <SelectTrigger 
                id="phase-select" 
                className="w-full h-12 text-base font-medium"
              >
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="START" className="py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">START</span>
                    <span className="text-sm text-muted-foreground">Beginning of event</span>
                  </div>
                </SelectItem>
                <SelectItem value="MID" className="py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">MID</span>
                    <span className="text-sm text-muted-foreground">Middle of event</span>
                  </div>
                </SelectItem>
                <SelectItem value="END" className="py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">END</span>
                    <span className="text-sm text-muted-foreground">End of event</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>Generating...</>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

