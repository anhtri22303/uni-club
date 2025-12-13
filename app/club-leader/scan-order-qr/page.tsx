"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Camera, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { getRedeemOrderByOrderCode, RedeemOrder } from "@/service/redeemApi"
import { useToast } from "@/hooks/use-toast"

export default function ScanOrderQRPage() {
  const [scanning, setScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isValidOrder, setIsValidOrder] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<RedeemOrder | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isProcessingRef = useRef(false) // Prevent multiple scans
  const router = useRouter()
  const { toast } = useToast()

  const startScanning = async () => {
    try {
      setError(null)
      setScannedCode(null)
      setIsValidOrder(null)
      setOrderData(null)
      isProcessingRef.current = false // Reset processing flag when starting new scan
      
      // Khởi tạo Html5Qrcode
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      // Bắt đầu quét
      await html5QrCode.start(
        { facingMode: "environment" }, // Camera sau
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Khi quét thành công
          handleQRCodeScanned(decodedText)
        },
        (errorMessage) => {
          // Lỗi quét (có thể bỏ qua)
        }
      )
      
      setScanning(true)
    } catch (err) {
      console.error("Error starting camera:", err)
      setError("Cannot access camera. Please check permissions.")
    }
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      } catch (err) {
        console.error("Error stopping camera:", err)
      }
      setScanning(false)
    }
  }

  const handleQRCodeScanned = async (decodedText: string) => {
    // Prevent multiple scans
    if (isProcessingRef.current) {
      return
    }
    
    
    // Loại bỏ khoảng trắng và chuyển về uppercase để check
    const trimmedText = decodedText.trim()
    
    // Tìm pattern UC-số/chữ (có thể có "Order Code:" phía trước hoặc không)
    // Pattern này sẽ tìm UC theo sau là dấu - và chữ/số (alphanumeric)
    const orderCodeMatch = trimmedText.match(/(?:Order Code:\s*)?(UC-[A-Z0-9]+)/i)
    
    if (orderCodeMatch) {
      const orderCode = orderCodeMatch[1].toUpperCase() // Lấy "UC-2C"
      
      // Kiểm tra 2 ký tự đầu phải là "UC"
      if (orderCode.substring(0, 2).toUpperCase() === "UC") {
        const orderId = orderCode.split("-")[1] // Lấy phần sau dấu gạch "2C"
        
        // Set processing flag immediately
        isProcessingRef.current = true
        
        setScannedCode(orderCode)
        setIsValidOrder(true)
        
        // Dừng quét ngay lập tức
        await stopScanning()
        
        // Gọi API để lấy thông tin đơn hàng
        setLoading(true)
        try {
          const order = await getRedeemOrderByOrderCode(orderCode)
          setOrderData(order)
          
          toast({
            title: "✅ Order Found!",
            description: `Order ${orderCode} - ${order.productName}`,
            variant: "default",
          })
          
          // Tự động chuyển sang trang chi tiết với orderCode
          setTimeout(() => {
            router.push(`/club-leader/club-order-list/${orderCode}`)
          }, 2000)
        } catch (err: any) {
          console.error("❌ API Error:", err)
          setIsValidOrder(false)
          setError(err.response?.data?.message || "Order not found or error occurred")
          toast({
            title: "❌ Error",
            description: err.response?.data?.message || "Cannot find order",
            variant: "destructive",
          })
          // Reset processing flag on error to allow retry
          isProcessingRef.current = false
        } finally {
          setLoading(false)
        }
      } else {
        setScannedCode(decodedText)
        setIsValidOrder(false)
      }
    } else {
      setScannedCode(decodedText)
      setIsValidOrder(false)
    }
  }

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/club-leader/club-order-list">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold dark:text-white">Scan Order QR Code</h1>
              <p className="text-muted-foreground dark:text-slate-400">
                Scan QR code to verify order
              </p>
            </div>
          </div>

          <Card className="border-muted dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Reader Container */}
              <div className="relative">
                <div 
                  id="qr-reader" 
                  className="w-full rounded-lg overflow-hidden bg-black"
                  style={{ minHeight: scanning ? "400px" : "0px" }}
                />
                
                {!scanning && (
                  <div className="flex items-center justify-center py-20 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-muted-foreground dark:text-slate-400 mb-4">
                        Click the button below to start scanning
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Scan Result */}
              {scannedCode && (
                <Card className={`border-2 ${
                  isValidOrder 
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {loading ? (
                        <div className="p-3 bg-blue-500 rounded-full animate-pulse">
                          <Loader2 className="h-12 w-12 text-white animate-spin" />
                        </div>
                      ) : isValidOrder ? (
                        <div className="p-3 bg-green-500 rounded-full">
                          <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500 rounded-full">
                          <XCircle className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className={`text-lg font-bold ${
                        loading ? "text-blue-700 dark:text-blue-300" :
                        isValidOrder 
                          ? "text-green-700 dark:text-green-300" 
                          : "text-red-700 dark:text-red-300"
                      }`}>
                        {loading ? "Loading Order..." : isValidOrder ? "Valid Order Code!" : "Invalid QR Code"}
                      </h3>
                      
                      <p className="font-mono text-xl font-bold dark:text-white">
                        {scannedCode}
                      </p>
                      
                      {orderData && isValidOrder && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mb-1">Product</p>
                          <p className="font-semibold dark:text-white">{orderData.productName}</p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2 mb-1">Member</p>
                          <p className="font-semibold dark:text-white">{orderData.memberName}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Redirecting to order details...
                          </p>
                        </div>
                      )}
                      
                      {!loading && isValidOrder && !orderData && (
                        <Button
                          onClick={() => router.push(`/club-leader/club-order-list`)}
                          className="mt-4 bg-green-600 hover:bg-green-700"
                        >
                          Go to Orders List
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!scanning ? (
                  <Button
                    onClick={startScanning}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    Stop Scanning
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
