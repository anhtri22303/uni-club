"use client"

import { useEffect, useRef, useState } from "react"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { QrCode, Download, Copy, CheckCircle } from "lucide-react"
import QRCodeLib from "qrcode"

interface EventItemOrderQRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  quantity: number
  membershipId: number
  eventId: number
  productName?: string
  eventName?: string
  memberName?: string
}

export function EventItemOrderQRModal({
  open,
  onOpenChange,
  productId,
  quantity,
  membershipId,
  eventId,
  productName = "Product",
  eventName,
  memberName,
}: EventItemOrderQRModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate QR code whenever modal opens or data changes
  useEffect(() => {
    if (open) {
      generateQRCode()
    }
  }, [open, productId, quantity, membershipId, eventId, productName, eventName, memberName])

  const generateQRCode = async () => {
    try {
      // Create the QR data object
      const qrData = {
        productId,
        quantity,
        membershipId,
        eventId,
        productName,
        eventName,
        memberName,
      }

      // Convert to JSON string
      const qrString = JSON.stringify(qrData)

      // Generate QR code as data URL
      const dataUrl = await QRCodeLib.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      setQrCodeDataUrl(dataUrl)

      // Also draw to canvas for download functionality
      if (canvasRef.current) {
        QRCodeLib.toCanvas(canvasRef.current, qrString, {
          width: 400,
          margin: 2,
        })
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

  const handleCopyData = () => {
    const qrData = {
      productId,
      quantity,
      membershipId,
      eventId,
      productName,
      eventName,
      memberName,
    }
    navigator.clipboard.writeText(JSON.stringify(qrData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `order-qr-${productId}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Your Order QR Code">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <QrCode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-semibold text-purple-900 dark:text-purple-300">
                {productName}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Event Item Order
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Product Name</div>
              <div className="font-mono font-semibold text-sm">{productName}</div>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Quantity</div>
              <div className="font-mono font-semibold text-sm">{quantity}</div>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Membership Name</div>
              <div className="font-mono font-semibold text-sm">{memberName}</div>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center py-6 bg-white dark:bg-slate-900 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt="Order QR Code" 
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}
          
          {/* Hidden canvas for download */}
          <canvas ref={canvasRef} className="hidden" />

          <p className="mt-4 text-sm text-center text-muted-foreground max-w-xs">
            Present this QR code at the event booth to receive your item
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCopyData}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Data
              </>
            )}
          </Button>
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        </div>

        {/* Info Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> This QR code contains your order information. 
            The staff at the event booth will scan it to process your redemption.
          </p>
        </div>
      </div>
    </Modal>
  )
}
