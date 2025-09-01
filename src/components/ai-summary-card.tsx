"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, RefreshCw, Sparkles } from "lucide-react"

interface AISummaryCardProps {
  summary: string
  confidence?: number
  sentiment?: "positive" | "neutral" | "negative"
  onRegenerate?: () => void
}

export function AISummaryCard({
  summary,
  confidence = 85,
  sentiment = "neutral",
  onRegenerate,
}: AISummaryCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await onRegenerate?.()
    setTimeout(() => setIsRegenerating(false), 2000)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/20 text-green-300 border-green-400/30"
      case "negative":
        return "bg-red-500/20 text-red-300 border-red-400/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-400/30"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊"
      case "negative":
        return "😔"
      default:
        return "😐"
    }
  }

  return (
    <Card className="glass-dark border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div>
              <CardTitle className="text-white text-sm">
                <span>Livara Summary</span>
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Content - Read Only */}
        <div className="text-gray-300 text-base leading-relaxed mb-6 mt-4 px-2">
          {isRegenerating ? (
            <div className="flex items-center justify-center space-x-2 py-8">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Regenerating summary...</span>
            </div>
          ) : (
            <div 
              className="prose prose-invert prose-base max-w-none text-left"
              style={{ 
                fontSize: '16px',
                lineHeight: '1.6',
                textAlign: 'left'
              }}
              dangerouslySetInnerHTML={{ 
                __html: summary
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
                  .replace(/\n\n/g, '</p><p class="mt-4">')
                  .replace(/\n/g, '<br/>')
                  .replace(/^\s*(.+)\s*$/, '<p class="mb-2">$1</p>')
                  .replace(/\}\}/g, '')
                  .replace(/\)\}/g, '')
              }}
            />
          )}
        </div>

      </CardContent>
    </Card>
  )
}
