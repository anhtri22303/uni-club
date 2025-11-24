"use client"

import { useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Camera, 
  AlertCircle,
  Package,
  Hash,
  User,
  Loader2,
  Calendar
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { redeemEventProduct, RedeemPayload } from "@/service/redeemApi"

interface EventRedeemScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ScannedData {
  productId: number
  quantity: number
  membershipId: number
  eventId: number
  productName?: string
  eventName?: string
  memberName?: string
}

export function EventRedeemScanner({
  open,
  onOpenChange,
  onSuccess,
}: EventRedeemScannerProps) {
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setScannedData(null)
      setScannerReady(false)
      return
    }

    let html5QrCode: Html5Qrcode | null = null

    const initScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader")

        // Get available cameras
        const devices = await Html5Qrcode.getCameras()
        
        if (devices && devices.length > 0) {
          // Use the back camera if available, otherwise use the first camera
          const cameraId = devices.length > 1 ? devices[1].id : devices[0].id

          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              try {
                // Parse JSON từ QR code
                const data = JSON.parse(decodedText)
                
                // Validate dữ liệu
                if (
                  typeof data.productId === "number" &&
                  typeof data.quantity === "number" &&
                  typeof data.membershipId === "number" &&
                  typeof data.eventId === "number"
                ) {
                  setScannedData(data)
                  setScannerReady(false)
                  
                  // Stop scanning safely
                  if (html5QrCode) {
                    html5QrCode.stop().catch((err) => {
                      console.warn("Scanner stop warning:", err)
                    })
                  }
                  
                  toast({
                    title: "QR Code Scanned",
                    description: "Order information extracted successfully!",
                    variant: "success",
                  })
                } else {
                  toast({
                    title: "Invalid QR Code",
                    description: "QR code does not contain valid order information.",
                    variant: "destructive",
                  })
                }
              } catch (error) {
                toast({
                  title: "Scan Error",
                  description: "Could not parse QR code data. Please try again.",
                  variant: "destructive",
                })
              }
            },
            (errorMessage) => {
              // Bỏ qua lỗi scanning thông thường (khi chưa tìm thấy QR)
              // console.log(errorMessage)
            }
          )

          setScannerReady(true)
        } else {
          toast({
            title: "No Camera Found",
            description: "No camera devices found on this device.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Scanner initialization error:", error)
        toast({
          title: "Camera Error",
          description: error.message || "Could not access camera. Please check permissions.",
          variant: "destructive",
        })
      }
    }

    // Delay nhỏ để đảm bảo DOM đã render
    const timer = setTimeout(initScanner, 300)

    return () => {
      clearTimeout(timer)
      if (html5QrCode) {
        html5QrCode.stop().catch((err) => {
          // Ignore errors when stopping scanner during cleanup
          console.warn("Scanner cleanup warning:", err)
        })
      }
    }
  }, [open, toast])

  const handleAccept = async () => {
    if (!scannedData) return

    setIsProcessing(true)

    try {
      const payload: RedeemPayload = {
        productId: scannedData.productId,
        quantity: scannedData.quantity,
        membershipId: scannedData.membershipId,
      }

      await redeemEventProduct(scannedData.eventId, payload)

      toast({
        title: "Redemption Successful!",
        description: "The order has been processed successfully.",
        variant: "success",
      })

      // Reset và đóng modal
      setScannedData(null)
      onOpenChange(false)

      // Callback để reload trang
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.message || "Could not process the redemption. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setScannedData(null)
    onOpenChange(false)
  }

  const handleRescan = () => {
    setScannedData(null)
    // Trigger re-init của scanner qua effect
    onOpenChange(false)
    setTimeout(() => onOpenChange(true), 100)
  }

  return (
    <Modal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Scan Event Order QR"
    >
      <div className="space-y-6">
        {!scannedData ? (
          // Scanner View
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                  <Camera className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Ready to Scan
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    Point your camera at the student's QR code
                  </div>
                </div>
              </div>
            </div>

            {/* Scanner Container */}
            <div className="relative">
              <div 
                id="qr-reader" 
                className="rounded-lg overflow-hidden border-2 border-dashed border-indigo-300 dark:border-indigo-700"
              />
              {!scannerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Ask the student to open their order QR code from the product page. 
                  The QR will automatically be detected and validated.
                </span>
              </p>
            </div>
          </div>
        ) : (
          // Scanned Data View
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-300">
                    QR Code Scanned Successfully
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Review the order details below
                  </div>
                </div>
              </div>
            </div>

            {/* Scanned Data Display */}
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Order Information</div>
                    <div className="text-sm text-muted-foreground">
                      Scanned from student's device
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Product Name
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {scannedData.productName || `#${scannedData.productId}`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantity
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-mono font-bold">
                      {scannedData.quantity}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Member Name
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {scannedData.memberName || `#${scannedData.membershipId}`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Event Name
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {scannedData.eventName || `#${scannedData.eventId}`}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRescan}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Again
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Redeem
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Button (always visible) */}
        {!scannedData && (
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </Modal>
  )
}
