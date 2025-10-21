"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Download, Save, RotateCcw, Upload, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCode from 'qrcode'

// Predefined color gradients
const gradientPresets = [
  { name: "Blue Purple", value: "from-blue-600 via-purple-600 to-indigo-700" },
  { name: "Pink Orange", value: "from-pink-500 via-red-500 to-orange-500" },
  { name: "Green Teal", value: "from-green-500 via-teal-500 to-cyan-600" },
  { name: "Purple Pink", value: "from-purple-600 via-pink-500 to-rose-600" },
  { name: "Dark Blue", value: "from-slate-700 via-blue-800 to-indigo-900" },
  { name: "Gold Amber", value: "from-yellow-500 via-amber-500 to-orange-600" },
  { name: "Emerald Ocean", value: "from-emerald-600 via-teal-600 to-blue-700" },
  { name: "Sunset", value: "from-orange-600 via-rose-600 to-purple-700" },
]

// Card patterns
const cardPatterns = [
  { name: "Circles", value: "circles" },
  { name: "Waves", value: "waves" },
  { name: "Grid", value: "grid" },
  { name: "Dots", value: "dots" },
  { name: "None", value: "none" },
]

// Border radius options
const borderRadiusOptions = [
  { name: "Small", value: "rounded-lg" },
  { name: "Medium", value: "rounded-xl" },
  { name: "Large", value: "rounded-2xl" },
  { name: "Extra Large", value: "rounded-3xl" },
]

// QR position options
const qrPositions = [
  { name: "Top Right", value: "top-right" },
  { name: "Top Left", value: "top-left" },
  { name: "Bottom Right", value: "bottom-right" },
  { name: "Bottom Left", value: "bottom-left" },
  { name: "Center Right", value: "center-right" },
  { name: "Hidden", value: "hidden" },
]

// QR styles
const qrStyles = [
  { name: "Default", value: "default" },
  { name: "Rounded", value: "rounded" },
  { name: "With Border", value: "bordered" },
  { name: "Shadow", value: "shadow" },
]

export default function CardEditorPage() {
  const { toast } = useToast()
  const cardRef = useRef<HTMLDivElement>(null)

  // Card customization state
  const [gradient, setGradient] = useState(gradientPresets[0].value)
  const [pattern, setPattern] = useState("circles")
  const [borderRadius, setBorderRadius] = useState("rounded-2xl")
  const [logoUrl, setLogoUrl] = useState("/images/Logo.png")
  const [backgroundImage, setBackgroundImage] = useState("")
  
  // Advanced customization
  const [showQR, setShowQR] = useState(true)
  const qrPosition = "center-right" // Fixed position
  const [qrSize, setQrSize] = useState([100])
  const [qrStyle, setQrStyle] = useState("default")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [showLogo, setShowLogo] = useState(true)
  const logoSize = [60] // Fixed smaller size
  const [patternOpacity, setPatternOpacity] = useState([10])
  const [cardOpacity, setCardOpacity] = useState([100])
  
  // Sample card data
  const cardData = {
    clubName: "Tech Innovation Club",
    studentName: "Nguyễn Văn A",
    studentCode: "SE123456",
    email: "student@example.com",
    major: "Software Engineering",
    role: "Club Leader",
    memberId: "001234",
  }

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          studentCode: cardData.studentCode,
          email: cardData.email,
          memberId: cardData.memberId,
        })
        
        const url = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
        })
        
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Error generating QR:', error)
      }
    }
    
    generateQR()
  }, [])

  const handleDownloadCard = async () => {
    if (!cardRef.current) return
    
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `club-card-${cardData.studentCode}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast({
        title: "Success",
        description: "Card downloaded successfully!",
      })
    } catch (error) {
      console.error('Error downloading card:', error)
      toast({
        title: "Error",
        description: "Failed to download card",
        variant: "destructive"
      })
    }
  }

  const handleSaveDesign = () => {
    const design = {
      gradient,
      pattern,
      borderRadius,
      logoUrl,
      backgroundImage,
      showQR,
      qrPosition,
      qrSize: qrSize[0],
      qrStyle,
      showLogo,
      logoSize: logoSize[0],
      patternOpacity: patternOpacity[0],
      cardOpacity: cardOpacity[0],
    }
    console.log('Saving design:', design)
    
    toast({
      title: "Design Saved",
      description: "Your card design has been saved successfully!",
    })
  }

  const handleReset = () => {
    setGradient(gradientPresets[0].value)
    setPattern("circles")
    setBorderRadius("rounded-2xl")
    setLogoUrl("/images/Logo.png")
    setBackgroundImage("")
    setShowQR(true)
    setQrSize([100])
    setQrStyle("default")
    setShowLogo(true)
    setPatternOpacity([10])
    setCardOpacity([100])
    
    toast({
      title: "Reset Complete",
      description: "Card design reset to default",
    })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const PatternOpacityWrapper = ({ opacity, children }: { opacity: number, children: React.ReactNode }) => {
    return <div className="contents" data-opacity={opacity}>{children}</div>
  }

  const renderPattern = () => {
    const opacityClass = `opacity-${patternOpacity[0]}`
    switch (pattern) {
      case "circles":
        return (
          <PatternOpacityWrapper opacity={patternOpacity[0]}>
            <div className={`absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 ${opacityClass}`}></div>
            <div className={`absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24 ${opacityClass}`}></div>
            <div className={`absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full ${opacityClass}`}></div>
          </PatternOpacityWrapper>
        )
      case "waves":
        return (
          <div className={`absolute inset-0 ${opacityClass}`}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="waves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="white" fill="none" strokeWidth="2"/>
                  <path d="M0 75 Q 25 50, 50 75 T 100 75" stroke="white" fill="none" strokeWidth="2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#waves)" />
            </svg>
          </div>
        )
      case "grid":
        return <div className={`absolute inset-0 bg-[repeating-linear-gradient(0deg,white_0px,white_2px,transparent_2px,transparent_40px),repeating-linear-gradient(90deg,white_0px,white_2px,transparent_2px,transparent_40px)] ${opacityClass}`}></div>
      case "dots":
        return (
          <div className={`absolute inset-0 ${opacityClass}`}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="2" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  // QR is fixed at center-right
  const getQrPositionClasses = () => {
    return "absolute top-1/2 right-4 -translate-y-1/2 z-20"
  }

  const getQrStyleClasses = () => {
    const baseClasses = "bg-white p-2"
    switch (qrStyle) {
      case "rounded":
        return `${baseClasses} rounded-xl`
      case "bordered":
        return `${baseClasses} rounded-lg border-4 border-white/50`
      case "shadow":
        return `${baseClasses} rounded-lg shadow-2xl`
      default:
        return `${baseClasses} rounded-lg`
    }
  }

  const GradientPreview = ({ gradientClass }: { gradientClass: string }) => {
    return <div className={`w-full h-12 rounded-md mb-2 bg-gradient-to-r ${gradientClass}`}></div>
  }

  const logoSizeValue = logoSize[0]
  const qrSizeValue = qrSize[0]

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Card Preview */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Card Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowQR(!showQR)}
                      >
                        {showQR ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <div 
                        ref={cardRef}
                        className={`bg-gradient-to-r ${gradient} ${borderRadius} shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl text-white relative overflow-hidden`}
                      >
                        {/* Background Image */}
                        {backgroundImage && (
                          <img 
                            src={backgroundImage} 
                            alt="Background" 
                            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none mix-blend-overlay" 
                          />
                        )}
                        
                        {/* Pattern */}
                        {renderPattern()}

                        {/* QR Code - Fixed at center-right, responsive size */}
                        {showQR && qrCodeUrl && (
                          <div className="absolute top-1/2 right-2 sm:right-3 md:right-4 -translate-y-1/2 z-20">
                            <div className={getQrStyleClasses()}>
                              <img 
                                src={qrCodeUrl} 
                                alt="QR Code"
                                className="object-contain"
                                width={qrSizeValue}
                                height={qrSizeValue}
                              />
                            </div>
                          </div>
                        )}

                        {/* Logo - Fixed at top-right, smaller size, responsive */}
                        {showLogo && logoUrl && (
                          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10">
                            <div className="bg-white/20 backdrop-blur-sm p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg">
                              <img 
                                src={logoUrl} 
                                alt="Club Logo"
                                className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                              />
                            </div>
                          </div>
                        )}

                        {/* Card Content */}
                        <div className="relative z-10">
                          {/* Card Header */}
                          <div className="mb-4 sm:mb-6 md:mb-8">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">{cardData.clubName}</h1>
                            <p className="text-white/80 text-xs sm:text-sm">Member Card</p>
                          </div>

                          {/* Profile Section - Adjusted for center-right QR */}
                          <div className="flex items-start gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 pr-20 sm:pr-24 md:pr-28">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                                  {cardData.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1 min-w-0">
                              <h2 className="text-base sm:text-lg md:text-2xl font-bold mb-1 sm:mb-2 truncate">{cardData.studentName}</h2>
                              <div className="space-y-0.5 sm:space-y-1 text-white/90">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-white/80">ID</span>
                                  <span className="font-mono text-sm sm:text-base md:text-lg font-semibold truncate">{cardData.studentCode}</span>
                                </div>
                                <div className="text-xs sm:text-sm truncate">{cardData.major}</div>
                                <div className="text-xs sm:text-sm text-white/80 truncate">{cardData.email}</div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info Grid */}
                          <div className="pt-3 sm:pt-4 md:pt-6 border-t border-white/20 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                            <div>
                              <div className="text-xs text-white/70 mb-0.5 sm:mb-1">Role</div>
                              <div className="text-xs sm:text-sm font-medium truncate">{cardData.role}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/70 mb-0.5 sm:mb-1">Member ID</div>
                              <div className="text-xs sm:text-sm font-medium font-mono truncate">#{cardData.memberId}</div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-4 border-t border-white/20 text-center">
                            <p className="text-xs text-white/70">
                              This card is issued by {cardData.clubName} for identification purposes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleDownloadCard} className="flex-1 w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Tải xuống</span>
                  </Button>
                  <Button onClick={handleSaveDesign} className="flex-1 w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Save Design</span>
                    <span className="sm:hidden">Lưu</span>
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                    <RotateCcw className="h-4 w-4 sm:mr-0" />
                    <span className="ml-2 sm:hidden">Đặt lại</span>
                  </Button>
                </div>
              </div>

              {/* Right Column - Customization Options */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customization Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="colors" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="colors">Colors</TabsTrigger>
                        <TabsTrigger value="style">Style</TabsTrigger>
                        <TabsTrigger value="qr">QR Code</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                      </TabsList>

                      {/* Colors Tab */}
                      <TabsContent value="colors" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="space-y-3">
                          <Label className="text-sm sm:text-base font-semibold">Chọn màu nền thẻ</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Chọn bảng màu phù hợp với thương hiệu câu lạc bộ
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {gradientPresets.map((preset) => (
                              <button
                                key={preset.value}
                                onClick={() => setGradient(preset.value)}
                                className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                                  gradient === preset.value 
                                    ? 'border-blue-600 ring-2 ring-blue-200 shadow-lg' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <GradientPreview gradientClass={preset.value} />
                                <p className="text-xs sm:text-sm font-medium text-center">{preset.name}</p>
                                {gradient === preset.value && (
                                  <div className="mt-1 text-center">
                                    <span className="text-xs text-blue-600 font-semibold">✓ Đang chọn</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Độ trong suốt thẻ</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Điều chỉnh độ đậm của màu nền
                              </p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{cardOpacity[0]}%</span>
                          </div>
                          <Slider
                            value={cardOpacity}
                            onValueChange={setCardOpacity}
                            min={50}
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Mờ (50%)</span>
                            <span>Đậm (100%)</span>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>💡 Gợi ý:</strong> Chọn màu tương phản để text dễ đọc hơn!
                          </p>
                        </div>
                      </TabsContent>

                      {/* Style Tab */}
                      <TabsContent value="style" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="space-y-3">
                          <Label className="text-sm sm:text-base font-semibold">Background Pattern</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Chọn họa tiết nền cho thẻ của bạn
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {cardPatterns.map((p) => (
                              <button
                                key={p.value}
                                onClick={() => setPattern(p.value)}
                                className={`p-2 sm:p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                                  pattern === p.value 
                                    ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {/* Pattern Preview Mini Card */}
                                <div className="w-full h-12 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-2 relative overflow-hidden">
                                  {p.value === 'circles' && (
                                    <>
                                      <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full -translate-x-3 -translate-y-3 opacity-20"></div>
                                      <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full translate-x-5 translate-y-5 opacity-20"></div>
                                    </>
                                  )}
                                  {p.value === 'waves' && (
                                    <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M0 8 Q 4 4, 8 8 T 16 8" stroke="white" fill="none" strokeWidth="1"/>
                                      <path d="M0 12 Q 4 8, 8 12 T 16 12" stroke="white" fill="none" strokeWidth="1"/>
                                    </svg>
                                  )}
                                  {p.value === 'grid' && (
                                    <div className="w-full h-full bg-[repeating-linear-gradient(0deg,white_0px,white_1px,transparent_1px,transparent_8px),repeating-linear-gradient(90deg,white_0px,white_1px,transparent_1px,transparent_8px)] opacity-20"></div>
                                  )}
                                  {p.value === 'dots' && (
                                    <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                                      <defs>
                                        <pattern id={`dots-preview-${p.value}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                          <circle cx="5" cy="5" r="1" fill="white"/>
                                        </pattern>
                                      </defs>
                                      <rect width="100%" height="100%" fill={`url(#dots-preview-${p.value})`} />
                                    </svg>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-center">{p.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {pattern !== 'none' && (
                          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-semibold">Độ mờ họa tiết</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Điều chỉnh độ hiển thị của họa tiết nền
                                </p>
                              </div>
                              <span className="text-sm font-bold text-blue-600">{patternOpacity[0]}%</span>
                            </div>
                            <Slider
                              value={patternOpacity}
                              onValueChange={setPatternOpacity}
                              min={0}
                              max={50}
                              step={5}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Ẩn (0%)</span>
                              <span>Rất rõ (50%)</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <Label className="text-sm sm:text-base font-semibold">Bo góc thẻ</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Chọn độ cong của các góc thẻ
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {borderRadiusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setBorderRadius(option.value)}
                                className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                                  borderRadius === option.value 
                                    ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {/* Border Radius Visual */}
                                <div className={`w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 ${option.value} mb-2`}></div>
                                <p className="text-xs sm:text-sm font-medium text-center">{option.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>💡 Gợi ý:</strong> Họa tiết ở mức 5-15% sẽ trông chuyên nghiệp hơn!
                          </p>
                        </div>
                      </TabsContent>

                      {/* QR Code Tab */}
                      <TabsContent value="qr" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <Label htmlFor="show-qr" className="font-semibold">Hiển thị mã QR</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Bật/tắt mã QR trên thẻ
                            </p>
                          </div>
                          <Switch
                            id="show-qr"
                            checked={showQR}
                            onCheckedChange={setShowQR}
                          />
                        </div>

                        {showQR && (
                          <>
                            <div className="space-y-3">
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <Label className="text-base font-semibold">📍 Vị trí mã QR</Label>
                                <p className="text-sm text-blue-700 mt-2">
                                  Mã QR được cố định ở vị trí <strong>Giữa - Bên phải</strong> để tối ưu khả năng quét
                                </p>
                              </div>
                            </div>

                            {/* Hidden section - keeping for backward compatibility */}
                            <div className="hidden">
                              <div className="grid grid-cols-2 gap-3">
                                {qrPositions.filter(pos => pos.value !== 'hidden').map((pos) => (
                                  <button
                                    key={pos.value}
                                    disabled
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      qrPosition === pos.value 
                                        ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {/* Position Visual */}
                                    <div className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-2 relative">
                                      <div className={`absolute w-4 h-4 bg-white rounded ${
                                        pos.value === 'top-right' ? 'top-1 right-1' :
                                        pos.value === 'top-left' ? 'top-1 left-1' :
                                        pos.value === 'bottom-right' ? 'bottom-1 right-1' :
                                        pos.value === 'bottom-left' ? 'bottom-1 left-1' :
                                        'top-1/2 right-1 -translate-y-1/2'
                                      }`}></div>
                                    </div>
                                    <p className="text-xs font-medium text-center">{pos.name}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="font-semibold">Kích thước QR</Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tối thiểu 80px để dễ quét
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{qrSize[0]}px</span>
                              </div>
                              <Slider
                                value={qrSize}
                                onValueChange={setQrSize}
                                min={60}
                                max={150}
                                step={10}
                                className="mt-2"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Nhỏ (60px)</span>
                                <span>Lớn (150px)</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm sm:text-base font-semibold">Kiểu khung QR</Label>
                              <p className="text-xs text-muted-foreground mb-2">
                                Chọn style cho khung QR code
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {qrStyles.map((style) => (
                                  <button
                                    key={style.value}
                                    onClick={() => setQrStyle(style.value)}
                                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                                      qrStyle === style.value 
                                        ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {/* QR Style Visual */}
                                    <div className="w-full h-12 sm:h-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-2">
                                      <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-white ${
                                        style.value === 'rounded' ? 'rounded-xl' :
                                        style.value === 'bordered' ? 'rounded-lg border-2 sm:border-4 border-white/50' :
                                        style.value === 'shadow' ? 'rounded-lg shadow-2xl' :
                                        'rounded-lg'
                                      }`}></div>
                                    </div>
                                    <p className="text-xs font-medium text-center line-clamp-1">{style.name}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                <strong>📱 QR chứa:</strong> Mã sinh viên, Email, Member ID
                              </p>
                            </div>
                          </>
                        )}

                        {!showQR && (
                          <div className="p-8 text-center text-muted-foreground">
                            <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Mã QR đã bị ẩn</p>
                            <p className="text-xs mt-1">Bật công tắc bên trên để hiển thị</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Images Tab */}
                      <TabsContent value="images" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <Label className="font-semibold">Logo Câu lạc bộ</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Hiển thị logo trên thẻ
                              </p>
                            </div>
                            <Switch
                              checked={showLogo}
                              onCheckedChange={setShowLogo}
                            />
                          </div>
                          
                          {showLogo && (
                            <div className="space-y-4 p-4 border-2 border-dashed border-slate-300 rounded-lg">
                              <div className="space-y-3">
                                <Label className="text-sm font-semibold">📤 Upload Logo</Label>
                                <p className="text-xs text-muted-foreground">
                                  Khuyến nghị: Ảnh PNG/JPG, nền trong suốt, tối thiểu 200x200px
                                </p>
                                <div className="flex items-center gap-3">
                                  <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {logoUrl && (
                                <>
                                  <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                                    <img src={logoUrl} alt="Logo Preview" className="w-20 h-20 object-contain" />
                                  </div>
                                  
                                  <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Label className="font-semibold">📏 Kích thước Logo</Label>
                                      <span className="text-sm font-bold text-amber-700">{logoSize[0]}px (Cố định)</span>
                                    </div>
                                    <p className="text-xs text-amber-700">
                                      Logo được cố định ở kích thước nhỏ gọn (60px) và đặt ở góc trên bên phải
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {!showLogo && (
                            <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg">
                              <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">Logo đã bị ẩn</p>
                              <p className="text-xs mt-1">Bật công tắc để hiển thị logo</p>
                            </div>
                          )}
                        </div>

                        <div className="h-px bg-slate-200"></div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-semibold">🖼️ Ảnh nền (Tùy chọn)</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Thêm ảnh nền để tạo điểm nhấn. Ảnh sẽ được làm mờ tự động
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <Input
                              id="background-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleBackgroundUpload}
                              className="flex-1"
                            />
                            {backgroundImage && (
                              <div className="mt-2 relative">
                                <img 
                                  src={backgroundImage} 
                                  alt="Background Preview" 
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setBackgroundImage("")}
                                  className="absolute top-2 right-2"
                                >
                                  ✕ Xóa
                                </Button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                                  ✓ Ảnh nền đã được thêm
                                </div>
                              </div>
                            )}

                            {!backgroundImage && (
                              <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                                <Upload className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                                <p className="text-sm text-slate-600">Chưa có ảnh nền</p>
                                <p className="text-xs text-muted-foreground mt-1">Click để chọn file</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>💡 Gợi ý:</strong> Ảnh nền không nên quá tối để text vẫn dễ đọc. Hệ thống sẽ tự động làm mờ ảnh 30%.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Professional Tips */}
                <Card className="hidden sm:block">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">💡 Gợi ý Thiết kế</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <p>✓ Đặt QR code ở vị trí dễ quét</p>
                    <p>✓ Điều chỉnh kích thước QR phù hợp (tối thiểu 80px)</p>
                    <p>✓ Sử dụng màu tương phản để text dễ đọc</p>
                    <p>✓ Test QR code trước khi hoàn thiện</p>
                    <p>✓ Giữ họa tiết ở mức 5-15% cho vẻ chuyên nghiệp</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
