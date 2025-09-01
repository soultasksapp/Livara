"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to conversations page since analytics is hidden
    router.replace('/dashboard/conversations')
  }, [router])

  return null
}
