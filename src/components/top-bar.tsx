"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Settings, User, LogOut, MessageSquare, Users, FileText, Brain, Building } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { apiClient } from "@/lib/api"

const pageNames: Record<string, string> = {
  "/dashboard": "Analytics Dashboard",
  "/dashboard/conversations": "Conversations",
  "/dashboard/contacts": "Contacts & Leads",
  "/dashboard/documents": "Documents",
  "/dashboard/widget": "Chat Widget",
  "/dashboard/users": "User Management",
  "/dashboard/teams": "Team Management",
  "/dashboard/settings": "Settings",
  "/dashboard/llm": "LLM Settings",
}

interface SearchResult {
  type: 'page' | 'conversation' | 'contact' | 'document'
  title: string
  subtitle?: string
  url: string
  icon: React.ElementType
}

interface DocumentSearchResult {
  original_filename?: string
  filename: string
  team_name?: string
  approval_status: string
  file_size: number
}

const navigationItems = [
  { title: "Analytics", url: "/dashboard", icon: Settings, keywords: ["analytics", "dashboard", "stats", "overview"] },
  { title: "Conversations", url: "/dashboard/conversations", icon: MessageSquare, keywords: ["conversations", "chat", "messages", "talks"] },
  { title: "Contacts & Leads", url: "/dashboard/contacts", icon: Users, keywords: ["contacts", "leads", "customers", "people"] },
  { title: "Documents", url: "/dashboard/documents", icon: FileText, keywords: ["documents", "files", "uploads", "docs"] },
  { title: "Chat Widget", url: "/dashboard/widget", icon: MessageSquare, keywords: ["widget", "embed", "chat", "api"] },
  { title: "User Management", url: "/dashboard/users", icon: User, keywords: ["users", "accounts", "people", "manage"] },
  { title: "Team Management", url: "/dashboard/teams", icon: Building, keywords: ["teams", "groups", "organization"] },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, keywords: ["settings", "configuration", "preferences"] },
  { title: "LLM Settings", url: "/dashboard/llm", icon: Brain, keywords: ["llm", "ai", "model", "openai", "ollama"] },
]

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const pageName = pageNames[pathname] || "Dashboard"
  const { user, logout, refreshUser } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [username, setUsername] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdatingColor, setIsUpdatingColor] = useState(false)
  const [profileColor, setProfileColor] = useState(user?.profile_color || '#3b82f6')
  const searchRef = useRef<HTMLDivElement>(null)

  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatUserRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Admin'
      case 'user':
        return 'User'
      default:
        return 'User'
    }
  }

  // Update username and profile color when user data changes
  useEffect(() => {
    if (user?.name) {
      setUsername(user.name)
    }
    if (user?.profile_color) {
      setProfileColor(user.profile_color)
      console.log('TopBar: Updated profile color to:', user.profile_color)
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      alert('Username cannot be empty')
      return
    }

    setIsUpdating(true)
    try {
      const response = await apiClient.put('/api/user/profile', {
        name: username.trim()
      })

      if (response.success) {
        alert('Username updated successfully!')
        // The user context should update automatically
      } else {
        alert('Failed to update username: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Failed to update username: Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateProfileColor = async () => {
    setIsUpdatingColor(true)
    try {
      const response = await apiClient.put('/api/user/profile', {
        name: user?.name || username,
        profile_color: profileColor
      })

      if (response.success) {
        alert('Profile color updated successfully!')
        // Close the modal and refresh user data
        setShowProfileModal(false)
        // Refresh user context to get updated profile color
        await refreshUser()
      } else {
        alert('Failed to update profile color: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Profile color update error:', error)
      alert('Failed to update profile color: Network error')
    } finally {
      setIsUpdatingColor(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!currentPassword) {
      alert('Please enter your current password')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long')
      return
    }

    setIsUpdating(true)
    try {
      const response = await apiClient.put('/api/user/password', {
        current_password: currentPassword,
        new_password: newPassword
      })

      if (response.success) {
        alert('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        alert('Failed to update password: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Password update error:', error)
      alert('Failed to update password: Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    const results: SearchResult[] = []

    // Search navigation items
    navigationItems.forEach(item => {
      const searchText = query.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(searchText)
      const keywordMatch = item.keywords.some(keyword => keyword.includes(searchText))
      
      if (titleMatch || keywordMatch) {
        // Check if user has access to this page
        if (item.url === "/dashboard/llm" && user?.role === 'user') return
        if (item.url === "/dashboard/users" && user?.role === 'user') return
        if (item.url === "/dashboard/teams" && user?.role !== 'super_admin') return // Hide team management from normal users and normal admins
        
        results.push({
          type: 'page',
          title: item.title,
          subtitle: `Navigate to ${item.title}`,
          url: item.url,
          icon: item.icon
        })
      }
    })

    // Search documents with team-based security
    try {
      const documentResponse = await apiClient.get(`/api/documents/search?q=${encodeURIComponent(query)}`)
      if (documentResponse.success && (documentResponse.data as { documents?: DocumentSearchResult[] })?.documents) {
        (documentResponse.data as { documents: DocumentSearchResult[] }).documents.forEach((doc: DocumentSearchResult) => {
          results.push({
            type: 'document',
            title: doc.original_filename || doc.filename,
            subtitle: `${doc.team_name ? `Team: ${doc.team_name}` : 'General'} • ${doc.approval_status} • ${(doc.file_size / 1024).toFixed(1)}KB`,
            url: '/dashboard/documents',
            icon: FileText
          })
        })
      }
    } catch (error) {
      console.error('Document search error:', error)
    }

    setSearchResults(results)
    setIsLoading(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setIsSearchOpen(query.trim().length > 0)
    performSearch(query)
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setSearchQuery("")
    setIsSearchOpen(false)
  }

  return (
    <header className="h-16 bg-black border-b border-white/10 px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-gray-400 hover:text-white" />
        <h1 className="text-xl font-semibold text-white">{pageName}</h1>
      </div>

      <div className="flex items-center space-x-4 flex-1 max-w-md mx-8">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search pages, documents, settings..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-400 smooth-transition"
          />
          
          {/* Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-spin h-4 w-4 border border-white/20 border-t-white rounded-full mx-auto"></div>
                  <span className="block mt-2">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <result.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-gray-400 text-sm truncate">{result.subtitle}</div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {result.type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() && (
                <div className="p-4 text-center text-gray-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <span>No results found for &quot;{searchQuery}&quot;</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User greeting */}
        {user && (
          <div className="text-gray-300 text-sm text-right">
            <div>Hi, <span className="text-white font-medium">{user.name}</span></div>
            <div className="text-gray-400 text-xs">{formatUserRole(user.role)}</div>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: user?.profile_color || '#3b82f6' }}
              >
                {user ? getUserInitials(user.name) : 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-dark border-white/10" align="end">
            <DropdownMenuItem 
              className="text-gray-300 hover:text-white hover:bg-white/10"
              onClick={() => router.push('/dashboard/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile Settings Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Profile Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter your username"
                disabled={isUpdating}
              />
              <Button 
                onClick={handleUpdateProfile}
                disabled={isUpdating || !username.trim() || username === user?.name}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? 'Updating...' : 'Update Username'}
              </Button>
            </div>

            {/* Profile Color Section */}
            <div className="space-y-2">
              <Label className="text-gray-300">Profile Picture Color</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: profileColor }}
                >
                  {getUserInitials(username || user?.name || '')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Preset colors */}
                  {[
                    '#3b82f6', // Blue
                    '#ef4444', // Red  
                    '#10b981', // Green
                    '#f59e0b', // Yellow
                    '#8b5cf6', // Purple
                    '#06b6d4', // Cyan
                    '#f97316', // Orange
                    '#84cc16', // Lime
                    '#ec4899', // Pink
                    '#6b7280', // Gray
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfileColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        profileColor === color ? 'border-white shadow-lg' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={isUpdatingColor}
                    />
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleUpdateProfileColor}
                disabled={isUpdatingColor || profileColor === (user?.profile_color || '#3b82f6')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdatingColor ? 'Saving...' : 'Save Color'}
              </Button>
            </div>

            {/* Email Section (Blocked) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                className="bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Password Reset Section */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-white font-medium">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter current password"
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter new password"
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Confirm new password"
                  disabled={isUpdating}
                />
              </div>

              <Button 
                onClick={handlePasswordReset}
                disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isUpdating ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
