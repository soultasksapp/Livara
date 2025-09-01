"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  MessageSquare,
  User,
  Mail,
  Phone,
  Calendar,
  Bot,
  Activity,
  StopCircle,
  BarChart3,
  RefreshCw,
  Edit3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import { AISummaryCard } from "@/components/ai-summary-card"
import { ConversationThread } from "@/components/conversation-thread"

// Simple markdown parser for formatting bold text, etc.
const parseMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** -> <strong>bold</strong>
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* -> <em>italic</em>
    .replace(/`(.*?)`/g, '<code>$1</code>') // `code` -> <code>code</code>
    .replace(/\n/g, '<br/>') // newlines -> <br/>
}

// Importance indicator component
const ImportanceIndicator = ({ 
  conversation, 
  onAssess, 
  isAssessing 
}: { 
  conversation: any, 
  onAssess: (id: string) => void, 
  isAssessing: boolean 
}) => {
  if (isAssessing) {
    return (
      <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-white"></div>
    )
  }

  if (conversation.importance_level) {
    const colors = {
      high: 'bg-red-500',       // High priority = Red
      medium: 'bg-yellow-500',  // Standard = Yellow
      low: 'bg-green-500'       // Low priority = Green
    }
    const color = colors[conversation.importance_level as keyof typeof colors] || 'bg-gray-500'
    
    return (
      <div 
        className={`w-4 h-4 rounded-full ${color} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => onAssess(conversation.id)}
        title={`${conversation.importance_level.charAt(0).toUpperCase() + conversation.importance_level.slice(1)} importance - Click to reassess`}
      />
    )
  }

  return (
    <div 
      className="w-4 h-4 rounded-full bg-gray-500 cursor-pointer hover:bg-gray-400 transition-colors"
      onClick={() => onAssess(conversation.id)}
      title="Click to assess importance"
    />
  )
}

// Memoized conversation row component
const ConversationRow = memo(({ 
  conversation, 
  isSelected, 
  onToggleSelect, 
  onAssessImportance, 
  isAssessing, 
  onPreview, 
  onEdit, 
  onEndSession, 
  onDelete, 
  isDeleting,
  userRole
}: {
  conversation: any
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onAssessImportance: (id: string) => void
  isAssessing: boolean
  onPreview: (conv: any) => void
  onEdit: (conv: any) => void
  onEndSession: (id: string) => void
  onDelete: (conv: any) => void
  isDeleting: boolean
  userRole: string
}) => {
  return (
    <TableRow key={conversation.id} className="border-white/10 hover:bg-white/5">
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => {
            console.log('Checkbox clicked for conversation:', conversation.id, 'checked:', checked)
            onToggleSelect(conversation.id)
          }}
          className="border-white/20"
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
      </TableCell>
      <TableCell>
        <ImportanceIndicator 
          conversation={conversation}
          onAssess={onAssessImportance}
          isAssessing={isAssessing}
        />
      </TableCell>
      <TableCell className="text-gray-300">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{new Date(conversation.start_time || conversation.startTime).toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell className="text-gray-300">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span>{conversation.messages?.length || conversation.messageCount || 0}</span>
        </div>
      </TableCell>
      <TableCell>
        {conversation.contact_info?.name || 
         conversation.contact_info?.names?.length > 0 || 
         conversation.contact_info?.emails?.length > 0 || 
         conversation.contact_info?.phones?.length > 0 || 
         conversation.hasContact ? (
          <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
            <Mail className="h-3 w-3 mr-1" />
            Has Contact
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            No Contact
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={
            conversation.status === "active"
              ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
          }
        >
          {conversation.status || "ended"}
        </Badge>
      </TableCell>
      <TableCell>
        {conversation.summary?.summary ? (
          <Badge 
            className="bg-purple-500/20 text-purple-300 border-purple-400/30 cursor-pointer hover:bg-purple-500/30 hover:text-purple-200 transition-colors"
            onClick={() => onPreview(conversation)}
          >
            Available
          </Badge>
        ) : (
          <Badge 
            variant="secondary" 
            className="bg-gray-500/20 text-gray-400 border-gray-500/30 cursor-pointer hover:bg-gray-500/30 hover:text-gray-300 transition-colors"
            onClick={() => onPreview(conversation)}
          >
            Unavailable
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="bg-slate-600 hover:bg-slate-700 text-white relative z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Preview button clicked for conversation:', conversation.id)
              onPreview(conversation)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          
          
          {(userRole === 'admin' || userRole === 'super_admin') && (
            <Button
              size="sm"
              className="bg-slate-600 hover:bg-slate-700 text-white relative z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Delete button clicked for conversation:', conversation.id)
                onDelete(conversation)
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
})

ConversationRow.displayName = 'ConversationRow'

export default function ConversationsPage() {
  // User authentication and role
  const { user } = useAuth()
  const userRole = user?.role || 'user'
  
  // State for data fetching and management
  const [conversations, setConversations] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionStats, setSessionStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  
  // State for dialogs and selections
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingConversation, setEditingConversation] = useState<any>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<Set<string>>(new Set())
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showSummaryView, setShowSummaryView] = useState(false)
  const [liveSummaryText, setLiveSummaryText] = useState<string | null>(null)
  const [summaryGenerating, setSummaryGenerating] = useState(false)
  const [assessingImportance, setAssessingImportance] = useState<Set<string>>(new Set())
  
  // Delete confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [deletingConversation, setDeletingConversation] = useState<any>(null)

  // Helper function for deep comparison optimization
  const deepCompare = (obj1: any, obj2: any): boolean => {
    try {
      return JSON.stringify(obj1) === JSON.stringify(obj2)
    } catch {
      return false
    }
  }

  // Memoized callback functions to prevent unnecessary re-renders
  const handleToggleSelect = useCallback((conversationId: string) => {
    toggleSelectConversation(conversationId)
  }, [])

  const handleAssessImportance = useCallback((conversationId: string) => {
    assessConversationImportance(conversationId)
  }, [])

  const handlePreview = useCallback((conversation: any) => {
    fetchConversationDetails(conversation.id)
    setIsPreviewOpen(true)
    setShowSummaryView(false)
    // Scroll to top when opening preview
    window.scrollTo(0, 0)
  }, [])

  const handleEdit = useCallback((conversation: any) => {
    setEditingConversation(conversation)
  }, [])

  const handleEndSession = useCallback((sessionId: string) => {
    endSession(sessionId)
  }, [])

  const handleDelete = useCallback((conversation: any) => {
    handleDeleteConversation(conversation)
  }, [])

  useEffect(() => {
    fetchData(true) // Show loader on initial load
    // Auto-refresh every 30 seconds, but skip if preview is open
    const interval = setInterval(() => {
      if (!isPreviewOpen) {
        fetchData(false) // No loader for background refreshes
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isPreviewOpen])

  // Main data fetching function
  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      }
      
      const [conversationsResponse, sessionsResponse, statsResponse] = await Promise.all([
        apiClient.get('/api/conversations'),
        apiClient.get('/api/sessions?status=all'),
        apiClient.get('/api/sessions/stats')
      ])

      if (conversationsResponse.success && conversationsResponse.data) {
        const newConvs = (conversationsResponse.data as any).conversations || []
        setConversations(prevConvs => {
          // Only update if data actually changed to prevent unnecessary re-renders
          if (!deepCompare(prevConvs, newConvs)) {
            return newConvs
          }
          return prevConvs
        })
      } else {
        console.error('Failed to load conversations:', conversationsResponse.error)
      }

      if (sessionsResponse.success && sessionsResponse.data) {
        const newSessions = (sessionsResponse.data as any).sessions || []
        setSessions(prevSessions => {
          if (!deepCompare(prevSessions, newSessions)) {
            return newSessions
          }
          return prevSessions
        })
      } else {
        console.error('Failed to load sessions:', sessionsResponse.error)
      }

      if (statsResponse.success && statsResponse.data) {
        const newStats = (statsResponse.data as any).stats || {}
        setSessionStats((prevStats: any) => {
          if (!deepCompare(prevStats, newStats)) {
            return newStats
          }
          return prevStats
        })
      } else {
        console.error('Failed to load session stats:', statsResponse.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  // Selection functions
  const toggleSelectConversation = (conversationId: string) => {
    setSelectedConversations(prevSelected => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(conversationId)) {
        newSelected.delete(conversationId)
      } else {
        newSelected.add(conversationId)
      }
      return newSelected
    })
  }


  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedConversations(new Set())
    } else {
      // Only select conversations on current page
      setSelectedConversations(new Set(paginatedConversations.map(conv => conv.id)))
    }
    setSelectAll(!selectAll)
  }

  // End session function
  const endSession = async (sessionId: string) => {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/end`, {})
      if (response.success) {
        await fetchData(false) // Refresh data
      } else {
        console.error('Failed to end session:', response.error)
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  // Delete functions
  const handleDeleteConversation = (conversation: any) => {
    setDeletingConversation(conversation)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteConversation = async () => {
    if (!deletingConversation) return
    
    try {
      setIsDeleting(true)
      
      const response = await apiClient.delete(`/api/conversations/${deletingConversation.id}`)
      
      if (response.success) {
        // Remove from selected if it was selected
        const newSelected = new Set(selectedConversations)
        newSelected.delete(deletingConversation.id)
        setSelectedConversations(newSelected)
        // Refresh data
        await fetchData(false)
        setIsDeleteDialogOpen(false)
        setDeletingConversation(null)
      } else {
        console.error('Delete failed:', response.error || response.message || 'Unknown error')
        alert(`Failed to delete conversation: ${response.error || response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Exception during delete:', error)
      alert(`Failed to delete conversation: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConversations = () => {
    if (selectedConversations.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDeleteConversations = async () => {
    if (selectedConversations.size === 0) return
    
    try {
      setIsDeleting(true)
      
      // Delete all selected conversations in parallel
      const deletePromises = Array.from(selectedConversations).map(conversationId =>
        apiClient.delete(`/api/conversations/${conversationId}`)
      )
      
      await Promise.all(deletePromises)
      
      // Clear selection and refresh data
      setSelectedConversations(new Set())
      setSelectAll(false)
      setIsBulkDeleteDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Exception during bulk delete:', error)
      alert(`Failed to delete conversations: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch individual conversation details
  const fetchConversationDetails = async (sessionId: string) => {
    try {
      // Clear live summary when loading a new conversation
      setLiveSummaryText(null)
      setSummaryGenerating(false)
      
      const response = await apiClient.get(`/api/sessions/${sessionId}`)
      
      if (response.success && response.data) {
        const sessionData = (response.data as any).session
        setSelectedConversation({
          ...sessionData,
          messages: sessionData.messages || []
        })
      } else {
        console.error('Failed to fetch conversation details:', response.error)
        // Fallback to the existing conversation data
        const fallbackConv = conversations.find(conv => 
          conv.id === sessionId
        )
        if (fallbackConv) {
          setSelectedConversation(fallbackConv)
        }
      }
    } catch (error) {
      console.error('Exception while fetching conversation details:', error)
      // Fallback to the existing conversation data
       const fallbackConv = conversations.find(conv => 
        conv.id === sessionId
      )
      if (fallbackConv) {
        setSelectedConversation(fallbackConv)
      }
    }
  }

  // Assess conversation importance function
  const assessConversationImportance = async (conversationId: string) => {
    try {
      setAssessingImportance(prev => new Set([...prev, conversationId]))
      
      // Get conversation details to check for contact info
      const conversation = conversations.find(conv => conv.id === conversationId)
      const hasContactInfo = conversation?.contact_info?.name || 
                           conversation?.contact_info?.names?.length > 0 ||
                           conversation?.contact_info?.emails?.length > 0 || 
                           conversation?.contact_info?.phones?.length > 0
      
      const response = await apiClient.post(`/api/conversations/${conversationId}/assess-importance`, {
        // Backend now automatically checks database for contact information
        instructions: "Assess conversation importance. Contact information automatically triggers high priority."
      })
      
      if (response.success) {
        // Refresh data to get updated importance level
        await fetchData(false)
      } else {
        console.error('Failed to assess importance:', response.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Exception during importance assessment:', error)
    } finally {
      setAssessingImportance(prev => {
        const newSet = new Set(prev)
        newSet.delete(conversationId)
        return newSet
      })
    }
  }

  // Generate AI summary function
  const generateAISummary = async (conversationId: string) => {
    try {
      setIsGeneratingSummary(prev => new Set([...prev, conversationId]))
      
      // Set generating state for smooth animations
      if (isPreviewOpen && selectedConversation?.id === conversationId) {
        setSummaryGenerating(true)
        // Immediately switch to summary view to show loading animation
        setShowSummaryView(true)
      }
      
      const response = await apiClient.post(`/api/conversations/${conversationId}/generate-summary`, {})
      
      if (response.success) {
        // Only if preview is open for this specific conversation, update summary text and switch view
        if (isPreviewOpen && selectedConversation?.id === conversationId) {
          // Extract the actual summary text from the response
          const summaryText = (response as any).summary || 
                             (response as any).data?.summary || 
                             response.message ||
                             'Summary generated successfully'
          
          console.log('Setting live summary text:', summaryText)
          setLiveSummaryText(summaryText)
          setSummaryGenerating(false)
          
          // Summary view is already active, content will update automatically
        }
        // Note: We skip fetchData() to avoid any UI disruption
        
      } else {
        console.error('Failed to generate summary:', response.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Exception during summary generation:', error)
    } finally {
      setIsGeneratingSummary(prev => {
        const newSet = new Set(prev)
        newSet.delete(conversationId)
        return newSet
      })
      setSummaryGenerating(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = 
      conv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages?.some((msg: any) => 
        msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Update total items when filtered conversations change
  useEffect(() => {
    setTotalItems(filteredConversations.length)
  }, [filteredConversations.length])

  // Paginated conversations
  const paginatedConversations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredConversations.slice(startIndex, endIndex)
  }, [filteredConversations, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Effect to update selectAll state when selection changes
  useEffect(() => {
    const currentPageIds = paginatedConversations.map(conv => conv.id)
    const currentPageSelected = currentPageIds.filter(id => selectedConversations.has(id))
    const allCurrentPageSelected = currentPageSelected.length === paginatedConversations.length && paginatedConversations.length > 0
    setSelectAll(allCurrentPageSelected)
  }, [selectedConversations, paginatedConversations])

  // CSV Export function (defined after filteredConversations)
  const exportToCSV = useCallback(() => {
    try {
      // Prepare CSV headers
      const headers = [
        'Session ID',
        'Start Time',
        'End Time', 
        'Status',
        'Source',
        'Message Count',
        'Has Contact Info',
        'Contact Names',
        'Contact Emails',
        'Contact Phones',
        'Importance Level',
        'Importance Assessed At',
        'Summary Available'
      ]

      // Prepare CSV data
      const csvData = filteredConversations.map(conv => [
        conv.id || '',
        conv.start_time ? new Date(conv.start_time).toLocaleString() : '',
        conv.end_time ? new Date(conv.end_time).toLocaleString() : '',
        conv.status || 'ended',
        conv.source || 'website',
        conv.messages?.length || conv.messageCount || 0,
        (conv.contact_info?.names?.length > 0 || conv.contact_info?.emails?.length > 0 || conv.contact_info?.phones?.length > 0 || conv.hasContact) ? 'Yes' : 'No',
        conv.contact_info?.names?.join('; ') || '',
        conv.contact_info?.emails?.join('; ') || '',
        conv.contact_info?.phones?.join('; ') || '',
        conv.importance_level || 'Not Assessed',
        conv.importance_assessed_at ? new Date(conv.importance_assessed_at).toLocaleString() : '',
        conv.summary?.summary ? 'Yes' : 'No'
      ])

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `conversations_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV file')
    }
  }, [filteredConversations])

  // Ensure page starts from top when preview opens
  useEffect(() => {
    if (isPreviewOpen && selectedConversation) {
      // Scroll to top immediately and after a short delay to handle any async rendering
      window.scrollTo(0, 0)
      setTimeout(() => window.scrollTo(0, 0), 100)
    }
  }, [isPreviewOpen, selectedConversation])

  // Show full-page conversation preview instead of the main list
  if (isPreviewOpen && selectedConversation) {
    return (
      <div className="w-full h-screen flex flex-col bg-gray-900">
        {/* Minimal Header */}
        <div className="border-b border-white/10 bg-gray-900/95 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Back button clicked in preview')
                  setIsPreviewOpen(false)
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 text-base relative z-20"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <div className="h-6 w-px bg-white/20"></div>
              <h1 className="text-white text-2xl font-medium">Conversation</h1>
              <Badge variant="secondary" className="bg-white/10 text-gray-300 text-base">
                {selectedConversation.status || "ended"}
              </Badge>
            </div>
            
            {/* Single Generate Button */}
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Generate Summary button clicked for conversation:', selectedConversation?.id)
                generateAISummary(selectedConversation?.id)
              }}
              disabled={isGeneratingSummary.has(selectedConversation?.id || '')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 text-base relative z-20"
            >
              {isGeneratingSummary.has(selectedConversation?.id || '') ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Generate Summary
            </Button>
          </div>
        </div>

        {/* Main Container with Sidebar & Chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Minimal Left Sidebar */}
          <div className="w-72 border-r border-white/10 bg-gray-950/50 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white text-base font-medium mb-3">Session Info</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span className="text-gray-300">{selectedConversation.messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span className="text-gray-300">{new Date(selectedConversation.start_time || selectedConversation.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="text-gray-300">{selectedConversation.source || "Website"}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info (if available) */}
              {(selectedConversation.contact_info?.name || selectedConversation.contact_info?.names?.length || selectedConversation.contact_info?.emails?.length || selectedConversation.contact_info?.phones?.length) && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white text-base font-medium mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    {/* Display contact name from form submission (legacy single name) */}
                    {selectedConversation.contact_info?.name && (
                      <div className="flex items-center space-x-2 text-white font-semibold text-base">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedConversation.contact_info.name}</span>
                      </div>
                    )}
                    {/* Display contact names from database (new array format) */}
                    {selectedConversation.contact_info?.names?.map((name: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-white font-semibold text-base">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{name}</span>
                      </div>
                    ))}
                    {selectedConversation.contact_info?.emails?.map((email: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-gray-300">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{email}</span>
                      </div>
                    ))}
                    {selectedConversation.contact_info?.phones?.map((phone: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-gray-300">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Container with Tabs */}
          <div className="flex-1 flex flex-col">
            {/* Minimal Tab Navigation */}
            <div className="border-b border-white/10 p-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSummaryView(false)}
                  className={`px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    !showSummaryView 
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                      : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="h-5 w-5 mr-2 inline" />
                  Messages
                </button>
                
                <button
                  onClick={() => setShowSummaryView(true)}
                  className={`px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    showSummaryView 
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                      : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Bot className="h-5 w-5 mr-2 inline" />
                  Livara Summary
                </button>
              </div>
            </div>

            {/* Chat-like Content Display with Fade Animation */}
            <div className="flex-1 relative overflow-hidden bg-gray-950/30 min-h-0">
              {/* Messages View */}
              <div 
                className={`absolute inset-0 transition-opacity duration-300 ${
                  !showSummaryView ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="h-full overflow-hidden">
                  <ConversationThread
                    messages={selectedConversation.messages || []}
                  />
                </div>
              </div>

              {/* AI Summary View */}
              <div 
                className={`absolute inset-0 transition-opacity duration-300 ${
                  showSummaryView ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="h-full p-6 overflow-y-auto">
                  {summaryGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-400 border-t-white mx-auto mb-4"></div>
                        <p className="text-gray-400 text-base">Generating AI summary...</p>
                      </div>
                    </div>
                  ) : liveSummaryText ? (
                    <AISummaryCard
                      summary={liveSummaryText}
                      confidence={90}
                      sentiment="neutral"
                      onRegenerate={() => generateAISummary(selectedConversation.id)}
                    />
                  ) : selectedConversation.summary?.summary ? (
                    <AISummaryCard
                      summary={selectedConversation.summary.summary}
                      confidence={selectedConversation.summary.confidence || 85}
                      sentiment={selectedConversation.summary.sentiment || "neutral"}
                      onRegenerate={() => generateAISummary(selectedConversation.id)}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <Bot className="h-20 w-20 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-white text-xl font-medium mb-2">No Livara Summary Available</h3>
                      <p className="text-gray-400 text-base mb-4 max-w-md mx-auto">
                        Use the "Generate Summary" button in the header to create a summary analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Conversations & Sessions</h1>
          <p className="text-gray-400">Monitor conversations, manage active sessions, and view session statistics</p>
        </div>
        <Button
          onClick={() => fetchData(true)}
          disabled={isLoading}
          className="bg-slate-600 hover:bg-slate-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-dark border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessionStats.total || 0}</div>
            <p className="text-xs text-gray-400">All sessions in database</p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessionStats.active || 0}</div>
            <p className="text-xs text-gray-400">Currently active sessions</p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Processing</CardTitle>
            <Activity className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessionStats.processing_sessions || 0}</div>
            <p className="text-xs text-gray-400">AI processing in background</p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Memory Sessions</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessionStats.memory_sessions || 0}</div>
            <p className="text-xs text-gray-400">Temporary sessions in memory</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Conversation Filters</CardTitle>
          <CardDescription className="text-gray-400">Search and filter conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Conversations</CardTitle>
              <CardDescription className="text-gray-400">
                <div className="space-y-2">
                  <div>
                    {totalItems} conversations found • Showing {paginatedConversations.length} of {totalItems}
                    {selectedConversations.size > 0 && (
                      <span className="ml-2 text-blue-400">
                        • {selectedConversations.size} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Importance:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>High Priority</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Standard</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Low Priority</span>
                    </div>
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedConversations.size > 0 && (userRole === 'admin' || userRole === 'super_admin') && (
                <Button 
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                  onClick={handleBulkDeleteConversations}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedConversations.size})
                </Button>
              )}
              <Button 
                className="bg-slate-600 hover:bg-slate-700 text-white"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300 w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(checked) => {
                        console.log('Select all checkbox clicked, checked:', checked)
                        toggleSelectAll()
                      }}
                      className="border-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Importance</TableHead>
                  <TableHead className="text-gray-300">Start Time</TableHead>
                  <TableHead className="text-gray-300">Messages</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Summary</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><div className="h-4 w-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversations.has(conversation.id)}
                    onToggleSelect={handleToggleSelect}
                    onAssessImportance={handleAssessImportance}
                    isAssessing={assessingImportance.has(conversation.id)}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onEndSession={handleEndSession}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                    userRole={userRole}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages} • {totalItems} total conversations
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-700 text-white disabled:bg-slate-800 disabled:text-gray-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        size="sm"
                        className={currentPage === pageNum 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-slate-700 hover:bg-slate-600 text-gray-300"
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-700 text-white disabled:bg-slate-800 disabled:text-gray-500"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - connects to existing handleEdit and editingConversation state */}
      <Dialog open={!!editingConversation} onOpenChange={(open) => !open && setEditingConversation(null)}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Conversation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update conversation details and metadata
            </DialogDescription>
          </DialogHeader>
          
          {editingConversation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conversation-status" className="text-white">Status</Label>
                <Select defaultValue={editingConversation.status || "ended"}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conversation-notes" className="text-white">Notes</Label>
                <Textarea
                  id="conversation-notes"
                  placeholder="Add notes about this conversation..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => setEditingConversation(null)}
              className="bg-slate-600 hover:bg-slate-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setEditingConversation(null)}
              className="bg-slate-600 hover:bg-slate-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Conversation Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteConversation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Conversations Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {selectedConversations.size} selected conversations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDeleteConversations}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

