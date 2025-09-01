"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Mail, Phone, Calendar, Download, Search, Eye, Trash2, MessageSquare, Bot, RefreshCw, Sparkles, User } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import { ConversationThread } from "@/components/conversation-thread"
import { AISummaryCard } from "@/components/ai-summary-card"

interface Contact {
  id: string
  session_id: string
  email: string
  phone?: string
  name?: string
  first_seen: string
  last_seen: string
  conversation_count: number
  status: string
}

export default function ContactsPage() {
  // User authentication and role
  const { user } = useAuth()
  const userRole = user?.role || 'user'
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // AI Summary states
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<Set<string>>(new Set())
  const [showSummaryView, setShowSummaryView] = useState(false)
  const [liveSummaryText, setLiveSummaryText] = useState<string | null>(null)
  const [summaryGenerating, setSummaryGenerating] = useState(false)
  
  // Delete confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  // Ensure page starts from top when preview opens
  useEffect(() => {
    if (isPreviewOpen && selectedContact) {
      // Scroll to top immediately and after a short delay to handle any async rendering
      window.scrollTo(0, 0)
      setTimeout(() => window.scrollTo(0, 0), 100)
    }
  }, [isPreviewOpen, selectedContact])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/contacts')
      
      if (response.success && response.data) {
        setContacts((response.data as any).contacts || [])
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Selection functions
  const toggleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    
    setSelectedContacts(newSelected)
    
    // Update selectAll state
    const allSelected = newSelected.size === filteredContacts.length
    const noneSelected = newSelected.size === 0
    if (allSelected || noneSelected) {
      setSelectAll(allSelected)
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(contact => contact.id)))
    }
    setSelectAll(!selectAll)
  }

  // Preview function - fetch conversation details using session_id
  const handlePreview = useCallback(async (contact: Contact) => {
    try {
      // Clear previous summary states
      setLiveSummaryText(null)
      setSummaryGenerating(false)
      setShowSummaryView(false)
      
      const response = await apiClient.get(`/api/sessions/${contact.session_id}`)
      
      if (response.success && response.data) {
        const sessionData = (response.data as any).session
        setSelectedContact({
          ...sessionData,
          messages: sessionData.messages || []
        })
        setIsPreviewOpen(true)
        window.scrollTo(0, 0)
      } else {
        console.error('Failed to fetch conversation details:', response.error)
        alert('No conversation data found for this contact')
      }
    } catch (error) {
      console.error('Exception while fetching conversation details:', error)
      alert('Failed to load conversation data')
    }
  }, [])

  // Generate AI summary function
  const generateAISummary = async (conversationId: string) => {
    try {
      setIsGeneratingSummary(prev => new Set([...prev, conversationId]))
      
      // Set generating state for smooth animations
      if (isPreviewOpen && selectedContact?.id === conversationId) {
        setSummaryGenerating(true)
        // Immediately switch to summary view to show loading animation
        setShowSummaryView(true)
      }
      
      const response = await apiClient.post(`/api/conversations/${conversationId}/generate-summary`, {})
      
      if (response.success) {
        // Only if preview is open for this specific conversation, update summary text and switch view
        if (isPreviewOpen && selectedContact?.id === conversationId) {
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

  // Delete functions
  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteContact = async () => {
    if (!deletingContact) return
    
    try {
      setIsDeleting(true)
      
      const response = await apiClient.delete(`/api/contacts/${deletingContact.id}`)
      
      if (response.success) {
        // Remove from selected if it was selected
        const newSelected = new Set(selectedContacts)
        newSelected.delete(deletingContact.id)
        setSelectedContacts(newSelected)
        // Refresh data
        await fetchContacts()
        setIsDeleteDialogOpen(false)
        setDeletingContact(null)
      } else {
        console.error('Delete failed:', response.error || response.message || 'Unknown error')
        alert(`Failed to delete contact: ${response.error || response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Exception during delete:', error)
      alert(`Failed to delete contact: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteContacts = () => {
    if (selectedContacts.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDeleteContacts = async () => {
    if (selectedContacts.size === 0) return
    
    try {
      setIsDeleting(true)
      
      // Delete all selected contacts in parallel
      const deletePromises = Array.from(selectedContacts).map(contactId =>
        apiClient.delete(`/api/contacts/${contactId}`)
      )
      
      await Promise.all(deletePromises)
      
      // Clear selection and refresh data
      setSelectedContacts(new Set())
      setSelectAll(false)
      setIsBulkDeleteDialogOpen(false)
      await fetchContacts()
    } catch (error) {
      console.error('Exception during bulk delete:', error)
      alert(`Failed to delete contacts: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Show full-page conversation preview if opened - Enhanced with AI Summary functionality
  if (isPreviewOpen && selectedContact) {
    return (
      <div className="w-full h-screen flex flex-col bg-gray-900">
        {/* Minimal Header */}
        <div className="border-b border-white/10 bg-gray-900/95 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsPreviewOpen(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 text-base"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Contacts
              </Button>
              <div className="h-6 w-px bg-white/20"></div>
              <h1 className="text-white text-2xl font-medium">Contact Conversation</h1>
              <Badge variant="secondary" className="bg-white/10 text-gray-300 text-base">
                {selectedContact.status || "ended"}
              </Badge>
            </div>
            
            {/* Generate Summary Button */}
            <Button
              onClick={() => generateAISummary(selectedContact?.id)}
              disabled={isGeneratingSummary.has(selectedContact?.id || '')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 text-base"
            >
              {isGeneratingSummary.has(selectedContact?.id || '') ? (
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
                    <span className="text-gray-300">{selectedContact.messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span className="text-gray-300">{new Date(selectedContact.start_time || selectedContact.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="text-gray-300">{selectedContact.source || "Website"}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(selectedContact.contact_info?.name || selectedContact.contact_info?.emails?.length || selectedContact.contact_info?.phones?.length) && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white text-base font-medium mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    {selectedContact.contact_info?.name && (
                      <div className="flex items-center space-x-2 text-white font-semibold text-base">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedContact.contact_info.name}</span>
                      </div>
                    )}
                    {selectedContact.contact_info?.emails?.map((email: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-gray-300">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{email}</span>
                      </div>
                    ))}
                    {selectedContact.contact_info?.phones?.map((phone: string, i: number) => (
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
            {/* Tab Navigation */}
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
                    messages={selectedContact.messages || []}
                    contactInfo={selectedContact.contact_info}
                    showContactBadge={!!(selectedContact.contact_info?.emails?.length || selectedContact.contact_info?.phones?.length)}
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
                      onRegenerate={() => generateAISummary(selectedContact.id)}
                    />
                  ) : selectedContact.summary?.summary ? (
                    <AISummaryCard
                      summary={selectedContact.summary.summary}
                      confidence={selectedContact.summary.confidence || 85}
                      sentiment={selectedContact.summary.sentiment || "neutral"}
                      onRegenerate={() => generateAISummary(selectedContact.id)}
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
    <div className="space-y-6">
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Contact Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage customer contacts and lead information
                {selectedContacts.size > 0 && (
                  <span className="ml-2 text-blue-400">
                    • {selectedContacts.size} selected
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedContacts.size > 0 && (userRole === 'admin' || userRole === 'super_admin') && (
                <Button 
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                  onClick={handleBulkDeleteContacts}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedContacts.size})
                </Button>
              )}
              <Button className="bg-slate-600 hover:bg-slate-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Contacts
            </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300 w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      className="border-white/20"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Phone</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Time</TableHead>
                  <TableHead className="text-gray-300">Conversations</TableHead>
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
                ) : filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => toggleSelectContact(contact.id)}
                        className="border-white/20"
                      />
                    </TableCell>
                    <TableCell className="text-white">
                      {contact.name || 'Anonymous'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {contact.phone ? (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{contact.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(contact.first_seen).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(contact.last_seen).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                        {contact.conversation_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-slate-600 hover:bg-slate-700 text-white"
                          onClick={() => handlePreview(contact)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {(userRole === 'admin' || userRole === 'super_admin') && (
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                            onClick={() => handleDeleteContact(contact)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Single Contact Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the contact "{deletingContact?.name || deletingContact?.email}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteContact}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Contacts Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {selectedContacts.size} selected contacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDeleteContacts}
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