import React from "react"
import { Badge } from "@/components/ui/badge"

export function renderTypeBadge(type?: string) {
  const t = String(type || "").toUpperCase()
  switch (t) {
    case "PUBLIC":
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
          Public
        </Badge>
      )
    case "PRIVATE":
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
          Private
        </Badge>
      )
    case "SPECIAL":
      return (
        <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-300">
          Special
        </Badge>
      )
    
    default:
      return <Badge variant="outline">{type || "Unknown"}</Badge>
  }
}

export default renderTypeBadge
