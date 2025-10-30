import { gradientPresets, solidColors, pastelColors, neonColors, monochromeColors } from "./constants"

export const getQrStyleClasses = (qrStyle: string) => {
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

export const getColorPresets = (colorType: string) => {
  switch (colorType) {
    case "solid":
      return solidColors
    case "pastel":
      return pastelColors
    case "neon":
      return neonColors
    case "monochrome":
      return monochromeColors
    default:
      return gradientPresets
  }
}

export const getAllColors = () => {
  return [...gradientPresets, ...solidColors, ...pastelColors, ...neonColors, ...monochromeColors]
}

export const handleColorSelection = (colorValue: string, type: string): { gradient: string, cardColorClass: string } => {
  if (type === "solid" || (type === "monochrome" && colorValue.startsWith("bg-"))) {
    return { gradient: colorValue, cardColorClass: "" }
  }
  return { gradient: colorValue, cardColorClass: "bg-gradient-to-r" }
}

export const downloadCardAsImage = async (cardRef: React.RefObject<HTMLDivElement>, cardName: string, studentCode: string, onSuccess: () => void, onError: (error: Error) => void) => {
  if (!cardRef.current) return
  
  try {
    const { default: html2canvas } = await import('html2canvas')
    
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: true,
    })
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${cardName.replace(/\s+/g, '-')}-${studentCode}-card.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        onSuccess()
      }
    }, 'image/png', 1.0)
  } catch (error) {
    onError(error as Error)
  }
}

export const shareCardAsImage = async (
  cardRef: React.RefObject<HTMLDivElement>, 
  cardName: string, 
  studentCode: string,
  onSuccess: () => void,
  onFallback: (blob: Blob) => void,
  onError: (error: Error) => void
) => {
  if (!cardRef.current) return
  
  try {
    const { default: html2canvas } = await import('html2canvas')
    
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: true,
    })
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File(
          [blob], 
          `${cardName.replace(/\s+/g, '-')}-card.png`, 
          { type: 'image/png' }
        )
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${cardName} - Member Card`,
              text: `Check out my member card for ${cardName}!`,
              files: [file]
            })
            onSuccess()
          } catch (shareError: any) {
            if (shareError.name !== 'AbortError') {
              onFallback(blob)
            }
          }
        } else {
          onFallback(blob)
        }
      }
    }, 'image/png', 1.0)
  } catch (error) {
    onError(error as Error)
  }
}

