import React from "react"

interface PatternRendererProps {
  pattern: string
  opacity: number
}

export const PatternRenderer: React.FC<PatternRendererProps> = ({ pattern, opacity }) => {
  // Convert opacity value to decimal for inline styles (0-50 -> 0-0.5)
  const opacityValue = opacity / 100
  
  switch (pattern) {
    case "circles":
      return (
        <>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" style={{ opacity: opacityValue }}></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24" style={{ opacity: opacityValue }}></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full" style={{ opacity: opacityValue }}></div>
        </>
      )
    case "waves":
      return (
        <div className="absolute inset-0" style={{ opacity: opacityValue }}>
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
      return <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,white_0px,white_2px,transparent_2px,transparent_40px),repeating-linear-gradient(90deg,white_0px,white_2px,transparent_2px,transparent_40px)]" style={{ opacity: opacityValue }}></div>
    case "dots":
      return (
        <div className="absolute inset-0" style={{ opacity: opacityValue }}>
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
    case "diagonal":
      return <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,white_0px,white_2px,transparent_2px,transparent_20px)]" style={{ opacity: opacityValue }}></div>
    case "hexagon":
      return (
        <div className="absolute inset-0" style={{ opacity: opacityValue }}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
                <polygon points="28,25 50,37.5 50,62.5 28,75 6,62.5 6,37.5" stroke="white" fill="none" strokeWidth="2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>
      )
    case "triangles":
      return (
        <div className="absolute inset-0" style={{ opacity: opacityValue }}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="triangles" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <polygon points="40,10 70,60 10,60" stroke="white" fill="none" strokeWidth="2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#triangles)" />
          </svg>
        </div>
      )
    case "stars":
      return (
        <div className="absolute inset-0" style={{ opacity: opacityValue }}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stars" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50,15 L57,40 L83,40 L62,55 L70,80 L50,65 L30,80 L38,55 L17,40 L43,40 Z" stroke="white" fill="none" strokeWidth="2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stars)" />
          </svg>
        </div>
      )
    default:
      return null
  }
}

