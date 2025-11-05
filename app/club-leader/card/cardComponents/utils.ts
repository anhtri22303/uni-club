import { gradientPresets, solidColors, pastelColors, neonColors, monochromeColors } from "./constants"

// Helper function to ensure styles are fully computed before capture
const prepareElementForCapture = async (element: HTMLElement) => {
  // Force a reflow to ensure all styles are computed
  void element.offsetHeight
  
  // Wait for any images to load
  const images = element.querySelectorAll('img')
  await Promise.all(
    Array.from(images).map(
      img =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve(null)
          } else {
            img.onload = () => resolve(null)
            img.onerror = () => resolve(null)
            // Timeout after 5 seconds
            setTimeout(() => resolve(null), 5000)
          }
        })
    )
  )
  
  // Wait for fonts to load
  if (document.fonts) {
    await document.fonts.ready
  }
  
  // Find the actual card element (has data-card-element attribute)
  const cardElement = element.querySelector('[data-card-element="true"]') as HTMLElement
  if (cardElement) {
    // Set a fixed width for export to prevent text wrapping/truncation
    // Store original inline style
    const originalStyle = cardElement.getAttribute('style') || ''
    const originalWidth = cardElement.style.width
    
    // Set fixed width for export (standard card width)
    cardElement.style.width = '800px'
    cardElement.style.maxWidth = '800px'
    cardElement.style.minWidth = '800px'
    
    // Find all elements with truncate class and override truncation
    const truncatedElements = cardElement.querySelectorAll('.truncate')
    const originalOverflows: { element: HTMLElement; overflow: string; textOverflow: string; whiteSpace: string }[] = []
    
    truncatedElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      // Store original styles
      originalOverflows.push({
        element: htmlEl,
        overflow: htmlEl.style.overflow,
        textOverflow: htmlEl.style.textOverflow,
        whiteSpace: htmlEl.style.whiteSpace
      })
      
      // Override truncation - allow text to display fully
      htmlEl.style.overflow = 'visible'
      htmlEl.style.textOverflow = 'clip'
      htmlEl.style.whiteSpace = 'normal'
    })
    
    // Store cleanup function on the element for later restoration
    ;(cardElement as any).__cleanupExport = () => {
      // Restore original width
      if (originalWidth) {
        cardElement.style.width = originalWidth
      } else {
        cardElement.style.removeProperty('width')
      }
      cardElement.style.removeProperty('max-width')
      cardElement.style.removeProperty('min-width')
      
      // Restore truncation styles
      originalOverflows.forEach(({ element, overflow, textOverflow, whiteSpace }) => {
        if (overflow) {
          element.style.overflow = overflow
        } else {
          element.style.removeProperty('overflow')
        }
        if (textOverflow) {
          element.style.textOverflow = textOverflow
        } else {
          element.style.removeProperty('text-overflow')
        }
        if (whiteSpace) {
          element.style.whiteSpace = whiteSpace
        } else {
          element.style.removeProperty('white-space')
        }
      })
    }
  }
  
  // Additional delay to ensure everything is rendered
  await new Promise(resolve => setTimeout(resolve, 300))
}

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

export const downloadCardAsImage = async (
  cardRef: React.RefObject<HTMLDivElement>, 
  cardName: string, 
  studentCode: string, 
  onSuccess: () => void, 
  onError: (error: Error) => void,
  quality: 'standard' | 'high' | 'ultra' = 'high'
) => {
  if (!cardRef.current) return
  
  try {
    const { toPng } = await import('html-to-image')
    
    // Quality settings
    const qualitySettings = {
      standard: { pixelRatio: 2, quality: 0.92 },
      high: { pixelRatio: 3, quality: 0.98 },
      ultra: { pixelRatio: 4, quality: 1.0 }
    }
    
    const settings = qualitySettings[quality]
    
    // Prepare element - wait for images, fonts, and styles
    await prepareElementForCapture(cardRef.current)
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: settings.pixelRatio,
        quality: settings.quality,
        skipFonts: false,
        preferredFontFormat: 'woff2',
        style: {
          // Ensure all CSS is properly rendered
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node) => {
          // Filter out any overlay elements or unwanted nodes
          const element = node as HTMLElement
          if (element.classList && element.classList.contains('no-export')) {
            return false
          }
          return true
        }
      })
      
      // Convert data URL to blob for download
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${cardName.replace(/\s+/g, '-')}-${studentCode}-card.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      onSuccess()
    } finally {
      // Cleanup: restore original styles
      const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
      if (cardElement && cardElement.__cleanupExport) {
        cardElement.__cleanupExport()
      }
    }
  } catch (error) {
    // Cleanup: restore original styles even on error
    const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
    if (cardElement && cardElement.__cleanupExport) {
      cardElement.__cleanupExport()
    }
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
    const { toPng } = await import('html-to-image')
    
    // Prepare element - wait for images, fonts, and styles
    await prepareElementForCapture(cardRef.current)
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        quality: 0.98,
        skipFonts: false,
        preferredFontFormat: 'woff2',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })
      
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
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
    } finally {
      // Cleanup: restore original styles
      const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
      if (cardElement && cardElement.__cleanupExport) {
        cardElement.__cleanupExport()
      }
    }
  } catch (error) {
    // Cleanup: restore original styles even on error
    const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
    if (cardElement && cardElement.__cleanupExport) {
      cardElement.__cleanupExport()
    }
    onError(error as Error)
  }
}

// New utility: Download card as different formats
export const downloadCardAsFormat = async (
  cardRef: React.RefObject<HTMLDivElement>, 
  cardName: string, 
  studentCode: string,
  format: 'png' | 'jpeg' | 'svg' = 'png',
  onSuccess: () => void, 
  onError: (error: Error) => void
) => {
  if (!cardRef.current) return
  
  try {
    const htmlToImage = await import('html-to-image')
    
    // Prepare element - wait for images, fonts, and styles
    await prepareElementForCapture(cardRef.current)
    
    try {
      let dataUrl: string
      let mimeType: string
      let extension: string
      
      const commonOptions = {
        cacheBust: true,
        skipFonts: false,
        preferredFontFormat: 'woff2' as const,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      }
      
      switch (format) {
        case 'jpeg':
          // JPEG needs a background color since it doesn't support transparency
          dataUrl = await htmlToImage.toJpeg(cardRef.current, {
            ...commonOptions,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            quality: 0.98
          })
          mimeType = 'image/jpeg'
          extension = 'jpg'
          break
        case 'svg':
          dataUrl = await htmlToImage.toSvg(cardRef.current, {
            ...commonOptions
          })
          mimeType = 'image/svg+xml'
          extension = 'svg'
          break
        case 'png':
        default:
          // PNG supports transparency, don't force a background
          dataUrl = await htmlToImage.toPng(cardRef.current, {
            ...commonOptions,
            pixelRatio: 3,
            quality: 0.98
          })
          mimeType = 'image/png'
          extension = 'png'
          break
      }
      
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${cardName.replace(/\s+/g, '-')}-${studentCode}-card.${extension}`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      onSuccess()
    } finally {
      // Cleanup: restore original styles
      const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
      if (cardElement && cardElement.__cleanupExport) {
        cardElement.__cleanupExport()
      }
    }
  } catch (error) {
    // Cleanup: restore original styles even on error
    const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
    if (cardElement && cardElement.__cleanupExport) {
      cardElement.__cleanupExport()
    }
    onError(error as Error)
  }
}

// New utility: Get card as base64 for API upload
export const getCardAsBase64 = async (
  cardRef: React.RefObject<HTMLDivElement>,
  format: 'png' | 'jpeg' = 'png'
): Promise<string> => {
  if (!cardRef.current) throw new Error('Card reference not found')
  
  const htmlToImage = await import('html-to-image')
  
  // Prepare element - wait for images, fonts, and styles
  await prepareElementForCapture(cardRef.current)
  
  try {
    const commonOptions = {
      cacheBust: true,
      pixelRatio: 3,
      skipFonts: false,
      preferredFontFormat: 'woff2' as const,
      quality: 0.98,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    }
    
    if (format === 'jpeg') {
      // JPEG needs a background color since it doesn't support transparency
      return await htmlToImage.toJpeg(cardRef.current, {
        ...commonOptions,
        backgroundColor: '#ffffff'
      })
    }
    
    // PNG supports transparency, don't force a background
    return await htmlToImage.toPng(cardRef.current, commonOptions)
  } finally {
    // Cleanup: restore original styles
    const cardElement = cardRef.current?.querySelector('[data-card-element="true"]') as any
    if (cardElement && cardElement.__cleanupExport) {
      cardElement.__cleanupExport()
    }
  }
}

