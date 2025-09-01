"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function InstructionsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to LLM settings with instructions tab
    router.replace("/dashboard/llm")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span className="text-white">Redirecting to LLM Settings...</span>
      </div>
    </div>
  )
} 