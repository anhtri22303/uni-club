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

  // Set canvas size to crop size
  canvas.width = crop.width
  canvas.height = crop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty')
      }
      resolve(blob)
    }, 'image/jpeg', 0.8)
  })
}

export function AvatarCropModal({ isOpen, onClose, imageSrc, onCropComplete }: AvatarCropModalProps) {
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

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    // Set initial crop to be square in the center
    const size = Math.min(width, height) * 0.8
    const x = (width - size) / 2
    const y = (height - size) / 2
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y,
    })
  }, [])

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
            Crop Avatar
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center overflow-auto max-h-[60vh]">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // Square aspect ratio for avatar
                minWidth={100}
                minHeight={100}
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
            Drag to move and resize the crop area. The image will be cropped to a square for the avatar.
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