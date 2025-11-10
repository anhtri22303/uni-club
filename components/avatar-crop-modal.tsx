"use client"

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Crop as CropIcon, X } from 'lucide-react'

interface AvatarCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void | Promise<void>
  aspectRatio?: number // Optional: defaults to 1 (square) for avatars
  title?: string // Optional: custom title for the modal
  minOutputWidth?: number // Optional: minimum width (in natural pixels) for the exported image
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string = 'cropped-avatar.jpg'
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // Set canvas size based on the source image's natural pixels to avoid blurriness
  const outputWidth = Math.round(crop.width * scaleX)
  const outputHeight = Math.round(crop.height * scaleY)
  canvas.width = outputWidth
  canvas.height = outputHeight

  // Draw the cropped image
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty')
      }
      resolve(blob)
    }, 'image/jpeg', 0.9)
  })
}

export function AvatarCropModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete,
  aspectRatio = 1, // Default to square for avatars
  title = "Crop Avatar", // Default title
  minOutputWidth
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [minCropWidth, setMinCropWidth] = useState<number>(100)
  const [minCropHeight, setMinCropHeight] = useState<number>(100)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget
    
    // Calculate initial crop based on aspect ratio
    let cropWidth: number
    let cropHeight: number
    
    if (aspectRatio === 1) {
      // Square crop (avatar)
      const size = Math.min(width, height) * 0.8
      cropWidth = size
      cropHeight = size
    } else {
      // Rectangular crop (background) - use aspect ratio
      if (width / height > aspectRatio) {
        // Image is wider than desired aspect ratio
        cropHeight = height * 0.8
        cropWidth = cropHeight * aspectRatio
      } else {
        // Image is taller than desired aspect ratio
        cropWidth = width * 0.8
        cropHeight = cropWidth / aspectRatio
      }
    }
    
    // Determine minimum crop size to meet desired min output resolution (in natural pixels)
    const effectiveMinOutputWidth = Math.max(
      1,
      Math.round(
        typeof minOutputWidth === 'number'
          ? minOutputWidth
          : (aspectRatio === 1 ? 512 : 1800)
      )
    )
    const scaleX = naturalWidth / width
    let computedMinCropWidth = Math.ceil(effectiveMinOutputWidth / scaleX)
    let computedMinCropHeight = Math.ceil(computedMinCropWidth / aspectRatio)

    // Ensure min crop fits within displayed image bounds
    if (computedMinCropWidth > width) {
      computedMinCropWidth = width
      computedMinCropHeight = Math.min(height, Math.ceil(width / aspectRatio))
    }
    if (computedMinCropHeight > height) {
      computedMinCropHeight = height
      computedMinCropWidth = Math.min(width, Math.ceil(height * aspectRatio))
    }

    setMinCropWidth(Math.max(1, computedMinCropWidth))
    setMinCropHeight(Math.max(1, computedMinCropHeight))

    // Enforce initial crop not smaller than min
    cropWidth = Math.max(cropWidth, computedMinCropWidth)
    cropHeight = Math.max(cropHeight, computedMinCropHeight)

    const x = (width - cropWidth) / 2
    const y = (height - cropHeight) / 2
    
    setCrop({
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
      x,
      y,
    })
  }, [aspectRatio, minOutputWidth])

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      return
    }

    try {
      setIsProcessing(true)
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      await onCropComplete(croppedBlob)
      // Modal will close after upload completes
      onClose()
    } catch (error) {
      console.error('Error cropping/uploading image:', error)
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center overflow-auto max-h-[60vh]">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                minWidth={minCropWidth}
                minHeight={minCropHeight}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="max-w-full h-auto max-h-96"
                />
              </ReactCrop>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            Drag to move and resize the crop area. {aspectRatio === 1 ? 'The image will be cropped to a square.' : 'Adjust the frame to fit your desired area.'}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CropIcon className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? 'Uploading...' : 'Crop & Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}