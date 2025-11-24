"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"
import { QRModal } from "@/components/qr-modal"
import QRCode from "qrcode"

interface PublicEventQRButtonProps {
  event: {
    id: number
    name: string
    checkInCode: string
  }
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function PublicEventQRButton({ 
  event, 
  variant = "default", 
  size = "default",
  className = ""
}: PublicEventQRButtonProps) {
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLinks, setQrLinks] = useState<{
    local?: string
    prod?: string
    mobile?: string
  }>({})
  const [qrRotations, setQrRotations] = useState<{
    local: string[]
    prod: string[]
    mobile?: string[]
  }>({ local: [], prod: [] })
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<
    "local" | "prod" | "mobile"
  >("prod")
  const [countdown, setCountdown] = useState(15)
  const ROTATION_INTERVAL_MS = 15 * 1000 // 15 seconds

  const generateQRCodes = async () => {
    try {
      const localUrl = `http://localhost:3000/student/checkin/public/${event.checkInCode}`
      const prodUrl = `https://uniclub.id.vn//student/checkin/public/${event.checkInCode}`
      // Mobile deep link - adjust IP address based on your mobile setup
      const mobileLink = `exp://192.168.1.50:8081/--/student/checkin/public/${event.checkInCode}`

      setQrLinks({
        local: localUrl,
        prod: prodUrl,
        mobile: mobileLink,
      })

      // Generate 3 QR code variants with different styles for rotation effect
      const styleVariants = [
        { color: { dark: "#000000", light: "#FFFFFF" }, margin: 1, width: 300 },
        { color: { dark: "#111111", light: "#FFFFFF" }, margin: 2, width: 300 },
        { color: { dark: "#222222", light: "#FFFFFF" }, margin: 0, width: 300 },
      ]

      const localQRs = await Promise.all(
        styleVariants.map((style) => QRCode.toDataURL(localUrl, style))
      )

      const prodQRs = await Promise.all(
        styleVariants.map((style) => QRCode.toDataURL(prodUrl, style))
      )

      const mobileQRs = await Promise.all(
        styleVariants.map((style) => QRCode.toDataURL(mobileLink, style))
      )

      setQrRotations({
        local: localQRs,
        prod: prodQRs,
        mobile: mobileQRs,
      })
    } catch (err) {
      console.error("Error generating QR codes:", err)
    }
  }

  const handleOpenQRModal = async () => {
    await generateQRCodes()
    setShowQrModal(true)
  }

  // QR rotation logic
  useEffect(() => {
    if (!showQrModal) {
      setCountdown(15)
      setDisplayedIndex(0)
      setIsFading(false)
      return
    }

    setCountdown(15)

    const rotId = setInterval(() => {
      setDisplayedIndex((prev) => (prev + 1) % 3)
      setCountdown(15)
    }, ROTATION_INTERVAL_MS)

    const cntId = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearInterval(rotId)
      clearInterval(cntId)
    }
  }, [showQrModal])

  // Fade animation
  useEffect(() => {
    if (!showQrModal) return
    setIsFading(true)
    const t = setTimeout(() => {
      setIsFading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [displayedIndex, showQrModal])

  const handleCopyLink = async (environment: "local" | "prod" | "mobile") => {
    try {
      const link = qrLinks[environment]
      if (!link) return
      await navigator.clipboard.writeText(link)
      // You can add a toast notification here
    } catch {
      console.error("Failed to copy link")
    }
  }

  const handleDownloadQR = async (environment: "local" | "prod" | "mobile") => {
    try {
      const qrs = qrRotations[environment as "local" | "prod"]
      if (!qrs || qrs.length === 0) return

      const link = document.createElement("a")
      link.href = qrs[displayedIndex]
      link.download = `public-event-${event.id}-${environment}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error downloading QR code:", err)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenQRModal}
        className={className}
      >
        <QrCode className="h-4 w-4 mr-2" />
        QR Public Event
      </Button>

      <QRModal
        open={showQrModal}
        onOpenChange={setShowQrModal}
        eventName={event.name}
        checkInCode={event.checkInCode}
        qrRotations={qrRotations}
        qrLinks={qrLinks}
        countdown={countdown}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        activeEnvironment={activeEnvironment}
        setActiveEnvironment={setActiveEnvironment}
        displayedIndex={displayedIndex}
        isFading={isFading}
        handleCopyLink={handleCopyLink}
        handleDownloadQR={handleDownloadQR}
      />
    </>
  )
}
