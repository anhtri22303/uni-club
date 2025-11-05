"use client"

import { useEffect, useState, useRef, useCallback } from 'react'

interface ImageResizerProps {
  editorRef: React.RefObject<HTMLDivElement>
}

export function ImageResizer({ editorRef }: ImageResizerProps) {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const resizeStartData = useRef<{
    width: number
    height: number
    aspectRatio: number
    mouseX: number
    mouseY: number
  } | null>(null)

  // Handle image click to select it
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicking on an image inside the editor
      if (target.tagName === 'IMG' && editorRef.current?.contains(target)) {
        e.preventDefault()
        e.stopPropagation()
        setSelectedImage(target as HTMLImageElement)
      } else if (!target.closest('.image-resize-overlay')) {
        // Clicking outside - deselect image
        setSelectedImage(null)
      }
    }

    document.addEventListener('click', handleImageClick)
    return () => document.removeEventListener('click', handleImageClick)
  }, [editorRef])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (!selectedImage) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle)
    
    const currentWidth = selectedImage.offsetWidth
    const currentHeight = selectedImage.offsetHeight
    const aspectRatio = currentWidth / currentHeight
    
    resizeStartData.current = {
      width: currentWidth,
      height: currentHeight,
      aspectRatio,
      mouseX: e.clientX,
      mouseY: e.clientY,
    }
  }, [selectedImage])

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !selectedImage || !resizeStartData.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartData.current) return
      
      const { width, height, aspectRatio, mouseX, mouseY } = resizeStartData.current
      const deltaX = e.clientX - mouseX
      const deltaY = e.clientY - mouseY
      
      let newWidth = width
      let newHeight = height
      
      // Calculate new dimensions based on which handle is being dragged
      switch (resizeHandle) {
        case 'se': // Bottom-right corner
          newWidth = Math.max(50, width + deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'sw': // Bottom-left corner
          newWidth = Math.max(50, width - deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'ne': // Top-right corner
          newWidth = Math.max(50, width + deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'nw': // Top-left corner
          newWidth = Math.max(50, width - deltaX)
          newHeight = newWidth / aspectRatio
          break
      }
      
      // Apply the new dimensions
      selectedImage.style.width = `${newWidth}px`
      selectedImage.style.height = `${newHeight}px`
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle('')
      resizeStartData.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, selectedImage, resizeHandle])

  // Deselect image when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!selectedImage) return null

  // Get image position
  const rect = selectedImage.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  return (
    <>
      {/* Selection overlay */}
      <div
        className="image-resize-overlay"
        style={{
          position: 'absolute',
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          width: rect.width,
          height: rect.height,
          border: '2px solid #3b82f6',
          pointerEvents: 'none',
          zIndex: 9998,
          boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)',
        }}
      />

      {/* Resize handles */}
      {['nw', 'ne', 'sw', 'se'].map((handle) => {
        let handleStyle: React.CSSProperties = {
          position: 'absolute',
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: `${handle}-resize`,
          zIndex: 9999,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }

        // Position each handle at the corners
        switch (handle) {
          case 'nw':
            handleStyle.top = rect.top + scrollTop - 6
            handleStyle.left = rect.left + scrollLeft - 6
            break
          case 'ne':
            handleStyle.top = rect.top + scrollTop - 6
            handleStyle.left = rect.left + scrollLeft + rect.width - 6
            break
          case 'sw':
            handleStyle.top = rect.top + scrollTop + rect.height - 6
            handleStyle.left = rect.left + scrollLeft - 6
            break
          case 'se':
            handleStyle.top = rect.top + scrollTop + rect.height - 6
            handleStyle.left = rect.left + scrollLeft + rect.width - 6
            break
        }

        return (
          <div
            key={handle}
            className="image-resize-handle"
            style={handleStyle}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        )
      })}

      {/* Size indicator */}
      <div
        style={{
          position: 'absolute',
          top: rect.top + scrollTop - 30,
          left: rect.left + scrollLeft,
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        {Math.round(rect.width)} × {Math.round(rect.height)} px
      </div>
    </>
  )
}

