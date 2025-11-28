"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Scan, X, Zap, CheckCircle } from "lucide-react"

export default function ScanPage() {
  const router = useRouter()
  const { auth } = useAuth()
  const [isScanning, setIsScanning] = useState(true)
  const [scanResult, setScanResult] = useState<string | null>(null)

  // Mock scanning animation
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        // Mock scan result after 3 seconds
        setScanResult("VCH-DEMO123")
        setIsScanning(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isScanning])

  // Auto redirect to check-in page for student after scan
  useEffect(() => {
    if (scanResult && auth.role === "student") {
      // Delay for a short moment to show success UI before redirect
      const redirectTimer = setTimeout(() => {
        router.push("/student/checkin")
      }, 1200)
      return () => clearTimeout(redirectTimer)
    }
  }, [scanResult, auth.role, router])

  const handleClose = () => {
    if (auth.role === "student") {
      router.push("/student")
    } else if (auth.role === "staff") {
      router.push("/student/staff/validate")
    } else {
      router.back()
    }
  }

  const handleRescan = () => {
    setScanResult(null)
    setIsScanning(true)
  }

  return (
  <ProtectedRoute allowedRoles={["student", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-semibold">
                {auth.role === "student" ? "Scan QR Code" : "Validate Voucher"}
              </h1>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>

          {/* Scanning Area */}
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
            <div className="w-full max-w-sm mx-auto">
              {/* Camera Viewfinder */}
              <div className="relative aspect-square bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/20">
                {/* Mock camera feed background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isScanning ? (
                    <div className="relative">
                      {/* Scanning frame */}
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-white rounded-lg relative">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />

                        {/* Scanning line animation */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse">
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce" />
                        </div>
                      </div>

                      {/* Scanning icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scan className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                    </div>
                  ) : scanResult ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">Scan Successful!</p>
                        <p className="text-sm text-gray-300">Code: {scanResult}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Grid overlay for camera effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 text-center space-y-4">
                {isScanning ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-primary animate-pulse" />
                      <p className="text-sm text-gray-300">Scanning...</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {auth.role === "student"
                        ? "Position the QR code within the frame"
                        : "Position the voucher QR code within the frame"}
                    </p>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      {auth.role === "student"
                        ? "QR code detected successfully!"
                        : "Voucher code scanned successfully!"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRescan}
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Scan Again
                      </Button>
                      <Button onClick={handleClose} className="flex-1">
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bottom tip */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-center text-gray-300">
                  💡 Tip: Make sure the code is well-lit and clearly visible
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}