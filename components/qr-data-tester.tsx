"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy } from "lucide-react"

interface QRDataTesterProps {
  qrData: any
  title?: string
}

export function QRDataTester({ qrData, title = "QR Code Data Structure" }: QRDataTesterProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const copyToClipboard = async (text: string, path?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPath(path || 'root')
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const renderValue = (value: any, path: string = '', level: number = 0): any => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{String(value)}</Badge>
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 font-mono">{value}</span>
    }

    if (typeof value === 'string') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-700 font-mono bg-green-50 px-1 rounded">"{value}"</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value, path)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    if (Array.isArray(value)) {
      return (
        <div className="ml-4 space-y-2">
          <div className="text-purple-600 font-semibold">Array ({value.length} items):</div>
          {value.map((item, index) => (
            <div key={index} className="border-l-2 border-purple-200 pl-3">
              <div className="text-sm text-purple-600">[{index}]</div>
              {renderValue(item, `${path}[${index}]`, level + 1)}
            </div>
          ))}
        </div>
      )
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4 space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="border-l-2 border-gray-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{key}:</span>
                {copiedPath === `${path}.${key}` && (
                  <Badge variant="outline" className="text-xs">Copied!</Badge>
                )}
              </div>
              <div className="ml-2">
                {renderValue(val, `${path}.${key}`, level + 1)}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <span className="text-gray-600">{String(value)}</span>
  }

  const formatJsonString = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(formatJsonString(qrData), 'full-json')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Full JSON
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showRaw ? (
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            <code>{formatJsonString(qrData)}</code>
          </pre>
        ) : (
          <div className="space-y-2">
            {renderValue(qrData)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}