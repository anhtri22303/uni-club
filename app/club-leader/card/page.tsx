"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import { Button } from "@/components/ui/button";
import { Download, Save, RotateCcw, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { CardPolicyModal } from "@/components/card-policy-modal";
import { ChatbotWidget } from "@/components/chatbot-widget";
import {
  CardPreview,
  ChatAssistant,
  CustomizationTabs,
  DownloadModal,
  gradientPresets,
  type CardData,
  downloadCardAsImage,
  downloadCardAsFormat,
  shareCardAsImage,
  handleColorSelection,
} from "./cardComponents";
import { useChatAssistant } from "./cardComponents/useChatAssistant";
import { createCard, type CreateCardRequest } from "@/service/cardApi";

export default function CardEditorPage() {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  // Card customization state
  const [colorType, setColorType] = useState("gradient");
  const [gradient, setGradient] = useState(gradientPresets[0].value);
  const [cardColorClass, setCardColorClass] = useState("bg-gradient-to-r");
  const [pattern, setPattern] = useState("circles");
  const [borderRadius, setBorderRadius] = useState("rounded-2xl");
  const [logoUrl, setLogoUrl] = useState("/images/Logo.png");

  // Advanced customization
  const [qrSize, setQrSize] = useState([100]);
  const [qrStyle, setQrStyle] = useState("default");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const logoSize = [60]; // Fixed smaller size
  const [patternOpacity, setPatternOpacity] = useState([10]);
  const [cardOpacity, setCardOpacity] = useState([100]);
  const [clubId, setClubId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Sample card data
  const cardData: CardData = {
    clubName: "Uniclub System ",
    studentName: "Nguyễn Văn A",
    studentCode: "SE123456",
    email: "student@example.com",
    major: "Software Engineering",
    role: "Club Leader",
    memberId: "001234",
  };

  // Load clubId from sessionStorage
  useEffect(() => {
    try {
      const authDataString = sessionStorage.getItem("uniclub-auth");
      if (authDataString) {
        const authData = JSON.parse(authDataString);
        if (authData.clubId) {
          setClubId(authData.clubId);
        }
      }
    } catch (error) {
      console.error("Error loading clubId from localStorage:", error);
    }
  }, []);

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          studentCode: cardData.studentCode,
          email: cardData.email,
          memberId: cardData.memberId,
        });

        const url = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        setQrCodeUrl(url);
      } catch (error) {
        console.error("Error generating QR:", error);
      }
    };

    generateQR();
  }, []);

  // Chat assistant hook
  const {
    chatMessages,
    chatInput,
    isChatLoading,
    setChatInput,
    handleChatMessage,
  } = useChatAssistant({
    colorType,
    gradient,
    pattern,
    borderRadius,
    qrSize,
    qrStyle,
    showLogo,
    patternOpacity,
    cardOpacity,
    onColorTypeChange: setColorType,
    onGradientChange: setGradient,
    onCardColorClassChange: setCardColorClass,
    onPatternChange: setPattern,
    onBorderRadiusChange: setBorderRadius,
    onQRSizeChange: setQrSize,
    onQRStyleChange: setQrStyle,
    onShowLogoChange: setShowLogo,
    onPatternOpacityChange: setPatternOpacity,
    onCardOpacityChange: setCardOpacity,
    toast,
  });

  const handleDownloadCard = (
    quality: "standard" | "high" | "ultra" = "high",
    format: "png" | "jpeg" | "svg" = "png"
  ) => {
    setIsDownloading(true);

    if (format === "png") {
      downloadCardAsImage(
        cardRef,
        cardData.clubName,
        cardData.studentCode,
        () => {
          setIsDownloading(false);
          setIsDownloadModalOpen(false);
          toast({
            title: "   Downloaded!",
            description: `Your card has been downloaded in ${quality} quality!`,
          });
        },
        (error) => {
          setIsDownloading(false);
          console.error("Error downloading card:", error);
          toast({
            title: "Error",
            description: "Failed to download card. Please try again.",
            variant: "destructive",
          });
        },
        quality
      );
    } else {
      downloadCardAsFormat(
        cardRef,
        cardData.clubName,
        cardData.studentCode,
        format,
        () => {
          setIsDownloading(false);
          setIsDownloadModalOpen(false);
          toast({
            title: "   Downloaded!",
            description: `Your card has been downloaded as ${format.toUpperCase()}!`,
          });
        },
        (error) => {
          setIsDownloading(false);
          console.error("Error downloading card:", error);
          toast({
            title: "Error",
            description: "Failed to download card. Please try again.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleShareCard = () => {
    shareCardAsImage(
      cardRef,
      cardData.clubName,
      cardData.studentCode,
      () => {
        toast({
          title: "   Shared!",
          description: "Card shared successfully!",
        });
      },
      (blob) => {
        // Fallback: Try to copy to clipboard or download
        if (navigator.clipboard && ClipboardItem) {
          try {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard
              .write([item])
              .then(() => {
                toast({
                  title: "📋 Copied to Clipboard!",
                  description: "Card image copied. You can paste it anywhere!",
                });
              })
              .catch(() => {
                downloadBlob(blob);
              });
          } catch {
            downloadBlob(blob);
          }
        } else {
          downloadBlob(blob);
        }
      },
      (error) => {
        console.error("Error sharing card:", error);
        toast({
          title: "Error",
          description: "Failed to share card. Please try downloading instead.",
          variant: "destructive",
        });
      }
    );
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${cardData.clubName.replace(/\s+/g, "-")}-${
      cardData.studentCode
    }-card.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📥 Downloaded!",
      description: "Sharing not supported. Card downloaded instead!",
    });
  };

  const handleSaveDesign = async () => {
    // Check if clubId exists
    if (!clubId) {
      toast({
        title: "  Error",
        description: "Club ID not found. Please make sure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Prepare the card design data according to API spec
      const cardDesignData: CreateCardRequest = {
        borderRadius,
        cardColorClass,
        cardOpacity: cardOpacity[0],
        colorType,
        gradient,
        logoSize: logoSize[0],
        pattern,
        patternOpacity: patternOpacity[0],
        qrPosition: "center-right",
        qrSize: qrSize[0],
        qrStyle,
        showLogo,
        logoUrl,
      };

      console.log("Saving design for clubId:", clubId, cardDesignData);

      // Call the API
      const savedCard = await createCard(clubId, cardDesignData);

      console.log("Card saved successfully:", savedCard);

      toast({
        title: "   Design Saved!",
        description: `Your card design has been saved successfully!`,
      });
    } catch (error: any) {
      console.error("Error saving design:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save card design";

      toast({
        title: "  Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setColorType("gradient");
    setGradient(gradientPresets[0].value);
    setCardColorClass("bg-gradient-to-r");
    setPattern("circles");
    setBorderRadius("rounded-2xl");
    setLogoUrl("/images/Logo.png");
    setQrSize([100]);
    setQrStyle("default");
    setShowLogo(true);
    setPatternOpacity([10]);
    setCardOpacity([100]);

    toast({
      title: "Reset Complete",
      description: "Card design reset to default",
    });
  };

  const handleColorSelect = (colorValue: string, type: string) => {
    const result = handleColorSelection(colorValue, type);
    setGradient(result.gradient);
    setCardColorClass(result.cardColorClass);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-2 sm:p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Title - Mobile Friendly */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2">
                🎨 Card Designer
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Create and customize your club membership cards
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column - Card Preview */}
              <div className="space-y-4">
                <CardPreview
                  ref={cardRef}
                  cardData={cardData}
                  colorType={colorType}
                  gradient={gradient}
                  cardColorClass={cardColorClass}
                  pattern={pattern}
                  borderRadius={borderRadius}
                  logoUrl={logoUrl}
                  qrCodeUrl={qrCodeUrl}
                  qrSize={qrSize[0]}
                  qrStyle={qrStyle}
                  showLogo={showLogo}
                  patternOpacity={patternOpacity[0]}
                  cardOpacity={cardOpacity[0]}
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="flex-1 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span>Download</span>
                  </Button>
                  <Button
                    onClick={handleShareCard}
                    variant="secondary"
                    className="flex-1 w-full sm:w-auto"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span>Share</span>
                  </Button>
                  <Button
                    onClick={handleSaveDesign}
                    variant="outline"
                    className="flex-1 w-full sm:w-auto"
                    disabled={isSaving || !clubId}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Saving</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Save Design</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="ml-2 sm:hidden">Reset</span>
                  </Button>
                </div>
              </div>

              {/* Right Column - Customization Options */}
              <div className="space-y-4">
                {/* AI Design Assistant Chatbot */}
                <ChatAssistant
                  messages={chatMessages}
                  inputValue={chatInput}
                  isLoading={isChatLoading}
                  isOpen={isChatOpen}
                  onToggleOpen={() => setIsChatOpen(!isChatOpen)}
                  onInputChange={setChatInput}
                  onSendMessage={handleChatMessage}
                  onQuickSuggestion={setChatInput}
                  onPolicyOpen={() => setIsPolicyOpen(true)}
                />

                {/* Customization Tabs */}
                <CustomizationTabs
                  colorType={colorType}
                  gradient={gradient}
                  cardOpacity={cardOpacity}
                  pattern={pattern}
                  borderRadius={borderRadius}
                  patternOpacity={patternOpacity}
                  qrSize={qrSize}
                  qrStyle={qrStyle}
                  showLogo={showLogo}
                  logoUrl={logoUrl}
                  logoSize={logoSize[0]}
                  onColorTypeChange={setColorType}
                  onColorSelect={handleColorSelect}
                  onCardOpacityChange={setCardOpacity}
                  onPatternChange={setPattern}
                  onBorderRadiusChange={setBorderRadius}
                  onPatternOpacityChange={setPatternOpacity}
                  onQRSizeChange={setQrSize}
                  onQRStyleChange={setQrStyle}
                  onShowLogoChange={setShowLogo}
                  onLogoUpload={handleLogoUpload}
                />
              </div>
            </div>

            {/* Download Modal */}
            <DownloadModal
              isOpen={isDownloadModalOpen}
              onClose={() => setIsDownloadModalOpen(false)}
              onDownload={handleDownloadCard}
              isDownloading={isDownloading}
            />

            {/* Card Policy Modal */}
            <CardPolicyModal
              isOpen={isPolicyOpen}
              onClose={() => setIsPolicyOpen(false)}
            />
          </div>
        </div>
      </AppShell>

      {/* Global Chatbot Widget */}
      <ChatbotWidget />
    </ProtectedRoute>
  );
}
