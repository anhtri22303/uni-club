"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, QrCode, AlertCircle, CheckCircle } from "lucide-react"

interface TopupModalProps {
  isOpen: boolean
  onClose: () => void
  /** Số tiền VND được set khi user chọn gói; nếu không có thì ẩn khung */
  selectedAmountVND?: number
}

export function TopupModal({ isOpen, onClose, selectedAmountVND }: TopupModalProps) {
  const accountInfo = {
    accountHolder: "NGUYEN THI KIM CHI",
    accountNumber: "fuoverflowbank",
    bank: "MB BANK",
    transferContent: "NAP1041S",
  }

  const VND_PER_POINT = 100
  const pointsFromVND =
    typeof selectedAmountVND === "number" ? Math.floor(selectedAmountVND / VND_PER_POINT) : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[980px] w-[95vw] max-h-[92vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-purple-500/20 p-0">
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                <CreditCard className="h-4 w-4" />
              </span>
              Nạp Point
            </DialogTitle>

            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-1 text-sm text-purple-200">
            Nạp tiền nhanh chóng và an toàn với mã QR hoặc chuyển khoản
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Thông tin tài khoản */}
              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-base font-semibold text-purple-200 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Thông tin tài khoản
                  </h3>

                  <div className="space-y-3">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-purple-200">CHỦ TÀI KHOẢN</div>
                      <div className="font-semibold text-white">{accountInfo.accountHolder}</div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-purple-200">SỐ TÀI KHOẢN</div>
                      <div className="font-semibold text-white">{accountInfo.accountNumber}</div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-purple-200">NGÂN HÀNG</div>
                      <div className="font-semibold text-white">{accountInfo.bank}</div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-purple-200">NỘI DUNG CHUYỂN</div>
                      <div className="font-semibold text-white">{accountInfo.transferContent}</div>
                    </div>
                  </div>

                  {/* Tỷ giá quy đổi */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-center">
                    <div className="text-white font-extrabold">10,000 VND = 100 Point</div>
                    <div className="text-xs text-orange-100">Tỷ giá quy đổi cố định</div>
                  </div>

                  {/* Số tiền cần chuyển (theo gói đã chọn) */}
                  {typeof selectedAmountVND === "number" && (
                    <div className="bg-slate-700/60 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-purple-200 mb-1">Số tiền cần chuyển</div>
                      <div className="text-2xl font-bold text-white">
                        {selectedAmountVND.toLocaleString()} VND
                      </div>
                      {pointsFromVND !== null && (
                        <div className="text-xs text-purple-200 mt-1">
                          Tương đương: <span className="font-semibold text-white">{pointsFromVND.toLocaleString()} Points</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lưu ý quan trọng */}
              <Card className="bg-gradient-to-r from-yellow-600 to-emerald-600 border-yellow-500/20">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Lưu ý quan trọng
                  </h3>

                  <ul className="text-sm text-yellow-50 space-y-2 leading-relaxed">
                    <li>• Vui lòng chuyển đúng nội dung để được cộng Point.</li>
                    <li>• Sau khi chuyển tiền, vui lòng chờ khoảng 1–2 phút để hệ thống xử lý.</li>
                    <li>• Nếu quá 10 phút chưa thấy cộng, hãy liên hệ hỗ trợ.</li>
                  </ul>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm">Liên hệ hỗ trợ:</span>
                    <Badge variant="secondary" className="bg-white text-emerald-700">Meiying</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Nút hỗ trợ */}
              <div className="text-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2.5 rounded-full">
                  Hỗ trợ đang hoạt động
                </Button>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* QR nạp tiền */}
              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-base font-semibold text-purple-200 flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Quét mã QR để nạp tiền
                  </h3>

                  <p className="text-sm text-purple-200">
                    Sử dụng ứng dụng ngân hàng để quét mã QR và chuyển tiền tự động.
                  </p>

                  <div className="flex justify-center">
                    <div className="relative bg-white rounded-lg p-4">
                      <img
                        src="/images/design-mode/image(1).png"
                        alt="QR Code for top-up"
                        className="w-56 h-56 object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <span className="text-xs text-slate-600">MB</span>
                        <div className="w-6 h-6 bg-red-600 rounded grid place-items-center text-white text-xs font-bold">
                          MB
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hướng dẫn nhanh */}
                  <div className="rounded-lg bg-slate-700/50 p-4 space-y-2">
                    <h4 className="font-semibold text-purple-100">Hướng dẫn nhanh</h4>
                    <ol className="text-sm text-purple-200 space-y-1 list-decimal list-inside">
                      <li>Mở ứng dụng banking trên điện thoại.</li>
                      <li>Chọn “Quét mã QR” hoặc “Chuyển tiền”.</li>
                      <li>Quét mã QR và xác nhận giao dịch.</li>
                      <li>Chờ 1–2 phút để hệ thống cập nhật số dư.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
