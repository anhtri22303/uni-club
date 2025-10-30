import React from "react"

interface GradientPreviewProps {
  gradientClass: string
}

export const GradientPreview: React.FC<GradientPreviewProps> = ({ gradientClass }) => {
  const isSolid = gradientClass.startsWith("bg-") && !gradientClass.includes("gradient")
  const classToUse = isSolid ? gradientClass : `bg-gradient-to-r ${gradientClass}`
  return <div className={`w-full h-12 rounded-md mb-2 ${classToUse}`}></div>
}

