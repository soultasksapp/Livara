"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Eye, Plus, Trash2, Key, Palette, Code, AlertCircle, CheckCircle2, FileText, Settings2, Search, Calendar, Download, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface WidgetKey {
  id: number
  api_key: string
  key_name: string
  is_active: boolean
  created_at: string
  usage_count?: number
  team_id?: number | null
  team_name?: string
  ngrok_url?: string
}

interface WidgetConfig {
  widget_title: string
  welcome_message: string
  position: 'bottom-right' | 'bottom-left'
  button_color: string
  button_text_color: string
}


interface WidgetQuestion {
  id?: number
  question_order: number
  question_text: string
  field_type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  field_options?: string
  is_required: boolean
  is_active: boolean
}

interface Team {
  id: number
  name: string
}

interface WordPressPluginButtonProps {
  apiKey: string
  keyName: string
  teamId: number | null | undefined
  serverUrl: string
  onSuccess: () => void
  onError: (error: string) => void
}

function WordPressPluginButton({ apiKey, keyName, teamId, serverUrl, onSuccess, onError }: WordPressPluginButtonProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'downloading' | 'error'>('idle')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const generatePlugin = async () => {
    try {
      setStatus('generating')
      console.log('Starting plugin generation...')
      console.log('Team ID:', teamId)
      console.log('API Key:', apiKey?.substring(0, 12) + '...')
      console.log('Server URL:', serverUrl)
      
      if (!teamId) {
        throw new Error('Team ID is required for plugin generation')
      }
      
      if (!apiKey) {
        throw new Error('API key is required for plugin generation')
      }
      
      if (!serverUrl) {
        throw new Error('Server URL is required for plugin generation')
      }
      
      const response = await apiClient.post(`/api/admin/teams/${teamId}/widget/generate-plugin`, {
        api_key: apiKey,
        server_url: serverUrl
      })

      console.log('Generate plugin response:', response)

      if (response.success && response.data?.download_url) {
        setDownloadUrl(response.data.download_url)
        setStatus('ready')
        onSuccess()
        console.log('Plugin generation successful, download URL:', response.data.download_url)
      } else {
        console.error('Generation failed:', response)
        const errorMessage = response.error || response.message || 'Plugin generation failed'
        console.error('Error details:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Plugin generation error:', error)
      setStatus('error')
      const errorMsg = error.message || 'Failed to generate plugin'
      console.error('Final error message:', errorMsg)
      onError(errorMsg)
      
      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const downloadPlugin = () => {
    console.log('Download button clicked!')
    console.log('Download URL available:', downloadUrl)
    
    if (!downloadUrl) {
      console.error('No download URL available!')
      onError('No download URL available')
      return
    }

    try {
      setStatus('downloading')
      console.log('Starting download from URL:', downloadUrl)
      
      // For external URLs, use window.open as it's more reliable
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        // Open in new window for external URLs
        const newWindow = window.open(downloadUrl, '_blank')
        
        // Check if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Fallback: try direct navigation
          window.location.href = downloadUrl
        }
      } else {
        // For relative URLs, use traditional download method
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = ''
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      console.log('Download initiated successfully')
      
      // Reset to idle state after a short delay
      setTimeout(() => {
        setStatus('idle')
        setDownloadUrl(null)
      }, 2000)
      
    } catch (error: any) {
      console.error('Plugin download error:', error)
      setStatus('error')
      onError(error.message || 'Failed to download plugin')
      
      // Reset to idle after 3 seconds for error state
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const getButtonConfig = () => {
    switch (status) {
      case 'idle':
        return {
          text: 'Generate Plugin',
          icon: Settings2,
          onClick: generatePlugin,
          disabled: false,
          className: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'generating':
        return {
          text: 'Generating...',
          icon: Loader2,
          onClick: () => {},
          disabled: true,
          className: 'bg-blue-600 cursor-not-allowed',
          iconClassName: 'animate-spin'
        }
      case 'ready':
        return {
          text: 'Download Plugin',
          icon: Download,
          onClick: downloadPlugin,
          disabled: false,
          className: 'bg-green-600 hover:bg-green-700'
        }
      case 'downloading':
        return {
          text: 'Downloading...',
          icon: Loader2,
          onClick: () => {},
          disabled: true,
          className: 'bg-green-600 cursor-not-allowed',
          iconClassName: 'animate-spin'
        }
      case 'error':
        return {
          text: 'Try Again',
          icon: AlertCircle,
          onClick: generatePlugin,
          disabled: false,
          className: 'bg-red-600 hover:bg-red-700'
        }
    }
  }

  const config = getButtonConfig()
  const IconComponent = config.icon

  return (
    <Button
      onClick={config.onClick}
      disabled={config.disabled}
      className={`text-white transition-all duration-200 ${config.className}`}
    >
      <IconComponent className={`h-4 w-4 mr-2 ${config.iconClassName || ''}`} />
      {config.text}
    </Button>
  )
}

export default function WidgetPage() {
  const { user } = useAuth()
  const [widgetKeys, setWidgetKeys] = useState<WidgetKey[]>([])
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    widget_title: 'Chatting with AI Agent',
    welcome_message: 'Hello! How can I help?',
    position: 'bottom-right',
    button_color: '#FFD700',
    button_text_color: '#000000'
  })
  const [loading, setLoading] = useState(true)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyUrl, setNewKeyUrl] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null | undefined>(undefined)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error'}[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [widgetQuestions, setWidgetQuestions] = useState<WidgetQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)
  const [selectedEmbedKey, setSelectedEmbedKey] = useState<WidgetKey | null>(null)
  const [previewWidgetLoaded, setPreviewWidgetLoaded] = useState(false)
  const [isLoadingWidget, setIsLoadingWidget] = useState(false)
  const [systemConfig, setSystemConfig] = useState({ ngrok_url: '' })

  useEffect(() => {
    loadWidgetData()
    loadSystemConfig()
  }, [])

  const loadSystemConfig = async () => {
    try {
      const response = await apiClient.get('/api/admin/system/ngrok-url')
      if (response.success && response.data) {
        setSystemConfig({ ngrok_url: response.data.ngrok_url })
      }
    } catch (error) {
      console.error('Failed to load system config:', error)
    }
  }

  const getDefaultUrl = () => {
    // Find the most recently created API key with a URL
    const keyWithUrl = widgetKeys
      .filter(key => key.ngrok_url)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    
    // Return the most recent key's URL, or fall back to system default
    return keyWithUrl?.ngrok_url || systemConfig.ngrok_url || ''
  }

  // Load live widget in preview
  useEffect(() => {
    if (previewOpen && selectedEmbedKey && !previewWidgetLoaded && !isLoadingWidget) {
      // Small delay to ensure full-page view is fully rendered
      setTimeout(() => {
        console.log('Starting widget load for full-page preview...')
        loadLiveWidgetPreview()
      }, 500)
    } else if (!previewOpen && previewWidgetLoaded) {
      cleanupLiveWidgetPreview()
    }
  }, [previewOpen, selectedEmbedKey, previewWidgetLoaded])

  // No real-time config updates - use actual widget as-is

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase())
  )

  const loadWidgetData = async () => {
    setLoading(true)
    try {
      let loadedKeys: WidgetKey[] = []
      
      // For super admins, load teams first and then load keys for all teams
      if (user?.role === 'super_admin') {
        const teamsResponse = await apiClient.get<{teams: Team[]}>('/api/admin/teams')
        if (teamsResponse.success && teamsResponse.data) {
          setTeams(teamsResponse.data.teams)
        }
        
        // Load widget keys for all teams (super admin view)
        const keysResponse = await apiClient.get<{keys: WidgetKey[]}>('/api/admin/widget/keys/all')
        if (keysResponse.success && keysResponse.data) {
          loadedKeys = keysResponse.data.keys
          setWidgetKeys(loadedKeys)
        }
      } else {
        // For normal admins, load keys for their team only
        if (!user?.team_id) {
          console.warn('User has no team_id assigned, cannot load team-specific widget keys')
          setWidgetKeys([])
          return
        }
        
        const keysResponse = await apiClient.get<{keys: WidgetKey[]}>(`/api/admin/teams/${user.team_id}/widget/keys`)
        if (keysResponse.success && keysResponse.data) {
          // Filter out any keys that don't belong to this team (additional security)
          const teamKeys = keysResponse.data.keys.filter(key => 
            key.team_id === user.team_id
          )
          loadedKeys = teamKeys
          setWidgetKeys(teamKeys)
        }
      }

      // Set selected key if not already set
      if (loadedKeys.length > 0 && !selectedEmbedKey) {
        setSelectedEmbedKey(loadedKeys[0])
      }

      // Load widget config and questions for the first key's team or user's team
      const firstKey = selectedEmbedKey || loadedKeys[0]
      const teamIdForConfig = firstKey?.team_id || user?.team_id
      
      if (teamIdForConfig) {
        // Load widget config for team-specific keys
        const configResponse = await apiClient.get<{config: WidgetConfig}>(`/api/admin/teams/${teamIdForConfig}/widget/config`)
        if (configResponse.success && configResponse.data?.config) {
          setWidgetConfig(configResponse.data.config)
        }

        // Load questions for team-specific keys
        const questionsResponse = await apiClient.get<{questions: WidgetQuestion[]}>(`/api/admin/teams/${teamIdForConfig}/widget/questions`)
        if (questionsResponse.success && questionsResponse.data?.questions) {
          setWidgetQuestions(questionsResponse.data.questions)
        } else {
          // Set default questions if none exist
          setWidgetQuestions([
            { question_order: 1, question_text: 'Full Name', field_type: 'text', is_required: true, is_active: true },
            { question_order: 2, question_text: 'Email Address', field_type: 'email', is_required: true, is_active: true },
            { question_order: 3, question_text: 'Phone Number', field_type: 'tel', is_required: true, is_active: true }
          ])
        }
      } else {
        // Default config for general API keys (super admin keys with no team)
        console.log('Loading default config for general/super admin keys')
        setWidgetConfig({
          widget_title: 'Chatting with AI Agent',
          welcome_message: 'Hello! How can I help?',
          position: 'bottom-right',
          button_color: '#FFD700',
          button_text_color: '#000000'
        })
        setWidgetQuestions([
          { question_order: 1, question_text: 'Full Name', field_type: 'text', is_required: true, is_active: true },
          { question_order: 2, question_text: 'Email Address', field_type: 'email', is_required: true, is_active: true },
          { question_order: 3, question_text: 'Phone Number', field_type: 'tel', is_required: true, is_active: true }
        ])
      }
    } catch (error) {
      console.error('Error loading widget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWidgetKey = async () => {
    if (!newKeyName.trim()) {
      showNotification('Please enter a key name', 'error')
      return
    }
    
    if (!(user?.role === 'admin' || user?.role === 'super_admin' || user?.widget_access)) {
      showNotification('Widget access permission required to create API keys', 'error')
      return
    }

    // For super admins, check if team selection has been made (null means general/super admin key)
    if (user?.role === 'super_admin' && selectedTeamId === undefined) {
      showNotification('Please select a team or choose "General (Super Admin)"', 'error')
      return
    }

    // For normal admins, use their team_id
    if (user?.role !== 'super_admin' && !user?.team_id) {
      showNotification('Team assignment required', 'error')
      return
    }

    setCreatingKey(true)
    try {
      const teamId = user?.role === 'super_admin' ? selectedTeamId : user?.team_id
      const response = await apiClient.post('/api/admin/widget/keys', {
        key_name: newKeyName,
        team_id: teamId,
        ngrok_url: newKeyUrl.trim() || null
      })
      
      if (response.success) {
        // Refresh data
        loadWidgetData()
        setShowNewKeyDialog(false)
        setNewKeyName('')
        setNewKeyUrl('')
        setSelectedTeamId(undefined)
        setTeamSearchTerm('')
        showNotification('API key created successfully!')
      } else {
        showNotification(response.message || 'Failed to create API key', 'error')
      }
    } catch (error) {
      console.error('Error creating widget key:', error)
      showNotification('Failed to create API key', 'error')
    } finally {
      setCreatingKey(false)
    }
  }

  const deleteWidgetKey = async (keyId: number, keyName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      // Find the key to get its team_id
      const keyToDelete = widgetKeys.find(key => key.id === keyId)
      if (!keyToDelete) {
        showNotification('API key not found', 'error')
        return
      }

      // For normal admins, ensure they can only delete keys from their own team
      if (user?.role !== 'super_admin' && keyToDelete.team_id !== user?.team_id) {
        showNotification('You can only delete API keys from your own team', 'error')
        return
      }

      // Use team-specific endpoint if the key belongs to a team
      let response
      if (keyToDelete.team_id) {
        response = await apiClient.delete(`/api/admin/teams/${keyToDelete.team_id}/widget/keys/${keyId}`)
      } else {
        // For general keys, use a different endpoint (would need to be created)
        response = await apiClient.delete(`/api/admin/widget/keys/${keyId}`)
      }

      if (response.success) {
        // Refresh data
        loadWidgetData()
        
        // If the deleted key was selected, clear selection
        if (selectedEmbedKey?.id === keyId) {
          setSelectedEmbedKey(null)
        }
        showNotification('API key deleted successfully!')
      } else {
        showNotification('Failed to delete API key', 'error')
      }
    } catch (error) {
      console.error('Error deleting widget key:', error)
      showNotification('Error deleting API key', 'error')
    }
  }

  const updateWidgetConfig = async () => {
    if (!user?.team_id) {
      showNotification('Team assignment required', 'error')
      return
    }

    // Validate configuration
    if (!widgetConfig.widget_title.trim()) {
      showNotification('Widget title is required', 'error')
      return
    }
    if (!widgetConfig.welcome_message.trim()) {
      showNotification('Welcome message is required', 'error')
      return
    }

    try {
      const response = await apiClient.put(`/api/admin/teams/${user.team_id}/widget/config`, widgetConfig)
      if (response.success) {
        showNotification('Configuration saved!')
      } else {
        showNotification(response.message || 'Failed to save configuration', 'error')
      }
    } catch (error) {
      console.error('Error updating widget config:', error)
      showNotification('Failed to save configuration', 'error')
    }
  }

  const updateWidgetQuestions = async () => {
    if (!user?.team_id) return

    setQuestionsLoading(true)
    try {
      const response = await apiClient.put(`/api/admin/teams/${user.team_id}/widget/questions`, {
        questions: widgetQuestions
      })
      if (response.success) {
        // Refresh questions without full page reload
        const questionsResponse = await apiClient.get<{questions: WidgetQuestion[]}>(`/api/admin/teams/${user.team_id}/widget/questions`)
        if (questionsResponse.success && questionsResponse.data?.questions) {
          setWidgetQuestions(questionsResponse.data.questions)
        }
        showNotification('Questions saved!')
      }
    } catch (error) {
      console.error('Error updating widget questions:', error)
      showNotification('Error saving questions', 'error')
    } finally {
      setQuestionsLoading(false)
    }
  }

  const addQuestion = () => {
    if (widgetQuestions.length >= 5) return
    
    const newQuestion: WidgetQuestion = {
      question_order: widgetQuestions.length + 1,
      question_text: '',
      field_type: 'text',
      is_required: true,
      is_active: true
    }
    setWidgetQuestions([...widgetQuestions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    if (widgetQuestions.length <= 1) return // Keep at least 1 question
    
    const updatedQuestions = widgetQuestions.filter((_, i) => i !== index)
    // Re-order remaining questions
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      question_order: i + 1
    }))
    setWidgetQuestions(reorderedQuestions)
  }

  const updateQuestion = (index: number, field: keyof WidgetQuestion, value: any) => {
    const updatedQuestions = [...widgetQuestions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setWidgetQuestions(updatedQuestions)
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showNotification(`${type} copied!`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      showNotification('Failed to copy', 'error')
    }
  }

  const generateEmbedCode = (apiKey: string) => {
    // Debug: Log environment variables
    console.log('Environment variables:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      FLASK_API_URL: process.env.FLASK_API_URL,
      NODE_ENV: process.env.NODE_ENV
    })
    
    const baseUrl = systemConfig.ngrok_url || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    process.env.FLASK_API_URL || 
                    'http://localhost:3034'
    
    console.log('Selected baseUrl:', baseUrl)
    
    return `<!-- Livara ChatBot Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/${apiKey}.js';
    script.async = true;
    script.onerror = function() {
      console.error('Failed to load Livara ChatBot widget. Please check your API key.');
    };
    document.head.appendChild(script);
  })();
</script>
<!-- End Livara ChatBot Widget -->`
  }

  const loadLiveWidgetPreview = async () => {
    if (!selectedEmbedKey) {
      showNotification('No API key selected for preview', 'error')
      return
    }

    if (isLoadingWidget) {
      console.log('Widget already loading, skipping...')
      return
    }

    console.log('Loading widget preview with key:', selectedEmbedKey.key_name)
    setIsLoadingWidget(true)

    try {
      // Clean up any existing widget first
      cleanupLiveWidgetPreview()
      
      // Always use the backend server for widget scripts
      console.log('Environment check:', {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        FLASK_API_URL: process.env.FLASK_API_URL,
        currentOrigin: window.location.origin
      })
      
      const baseUrl = systemConfig.ngrok_url || 
                      process.env.NEXT_PUBLIC_API_URL || 
                      'http://localhost:3034' // Direct fallback to backend
      const scriptUrl = `${baseUrl}/widget/${selectedEmbedKey.api_key}.js`
      
      console.log('Loading widget from:', scriptUrl)
      console.log('Selected API key:', selectedEmbedKey.api_key)
      
      // Create and load widget script
      const script = document.createElement('script')
      script.id = 'preview-widget-script'
      script.src = scriptUrl
      script.async = true
      
      script.onload = () => {
        console.log('Widget script loaded successfully')
        setPreviewWidgetLoaded(true)
        setIsLoadingWidget(false)
        
        // Move widget to preview container with multiple attempts
        const attemptToMoveWidget = (attempt = 1) => {
          // The widget creates a 'chat-bubble' container as the main wrapper
          const widgetContainer = document.getElementById('chat-bubble')
          const previewContainer = document.getElementById('live-widget-preview')
          
          // Debug: Check all elements on the page
          const allElements = document.querySelectorAll('[id*="chat"], [id*="bubble"], [class*="chat"]')
          console.log(`Attempt ${attempt}: Looking for widget container (chat-bubble)...`, widgetContainer ? 'Found' : 'Not found')
          console.log(`Debug: Found ${allElements.length} chat-related elements:`, Array.from(allElements).map(el => ({ id: el.id, class: el.className, tag: el.tagName })))
          
          if (widgetContainer && previewContainer) {
            console.log('Moving chat-bubble widget to preview container')
            
            try {
              // Remove fixed positioning and adjust for preview
              widgetContainer.style.position = 'relative'
              widgetContainer.style.bottom = 'auto'
              widgetContainer.style.right = 'auto'
              widgetContainer.style.top = 'auto'
              widgetContainer.style.left = 'auto'
              widgetContainer.style.zIndex = '1'
              widgetContainer.style.transform = 'none'
              widgetContainer.style.margin = '0'
              
              // Safely move the widget
              if (widgetContainer.parentNode) {
                widgetContainer.parentNode.removeChild(widgetContainer)
              }
              previewContainer.appendChild(widgetContainer)
              
              console.log('Widget successfully moved to preview container')
              
            } catch (error) {
              console.error('Error moving widget:', error)
              showNotification('Error positioning widget', 'error')
            }
            
          } else if (attempt < 15) {
            // Retry up to 15 times with increasing delays (widget might take time to load)
            setTimeout(() => attemptToMoveWidget(attempt + 1), attempt * 300)
          } else {
            console.error('Failed to find chat-bubble widget container after 15 attempts')
            console.error('Preview container found:', !!previewContainer)
            console.error('Widget container found:', !!widgetContainer)
            showNotification('Widget loaded but could not be positioned. Check browser console for details.', 'error')
          }
        }
        
        attemptToMoveWidget()
      }
      
      script.onerror = (error) => {
        console.error('Failed to load preview widget script:', error)
        console.error('Script URL:', scriptUrl)
        console.error('API Key:', selectedEmbedKey.api_key)
        console.error('Base URL:', baseUrl)
        showNotification(`Failed to load widget script from ${baseUrl}. Check server connection and API key validity.`, 'error')
        setPreviewWidgetLoaded(false)
        setIsLoadingWidget(false)
      }
      
      document.head.appendChild(script)
    } catch (error) {
      console.error('Error loading live widget preview:', error)
      showNotification('Error loading widget preview', 'error')
      setPreviewWidgetLoaded(false)
      setIsLoadingWidget(false)
    }
  }



  const cleanupLiveWidgetPreview = () => {
    try {
      console.log('Cleaning up widget preview')
      
      // Debug: Check what exists before cleanup
      const allWidgetElements = document.querySelectorAll('[id*="chat"], [id*="bubble"], [class*="chat"]')
      console.log(`Debug: Found ${allWidgetElements.length} widget-related elements before cleanup:`, Array.from(allWidgetElements).map(el => ({ id: el.id, class: el.className, tag: el.tagName })))
      
      // Safely remove widget elements (chat-bubble is the main container)
      const widgetContainer = document.getElementById('chat-bubble')
      if (widgetContainer && widgetContainer.parentNode) {
        console.log('Removing chat-bubble widget container')
        try {
          widgetContainer.parentNode.removeChild(widgetContainer)
        } catch (e) {
          console.log('Widget container already removed or no parent')
        }
      }
      
      // Safely remove script
      const script = document.getElementById('preview-widget-script')
      if (script && script.parentNode) {
        console.log('Removing widget script')
        try {
          script.parentNode.removeChild(script)
        } catch (e) {
          console.log('Script already removed or no parent')
        }
      }
      
      // Clear preview container safely
      const previewContainer = document.getElementById('live-widget-preview')
      if (previewContainer) {
        try {
          // Remove only direct children that we added (chat-bubble widget)
          const children = Array.from(previewContainer.children)
          children.forEach(child => {
            if (child.id === 'chat-bubble') {
              try {
                previewContainer.removeChild(child)
              } catch (e) {
                console.log('Child already removed')
              }
            }
          })
        } catch (e) {
          console.log('Error clearing preview container:', e)
        }
      }
      
      setPreviewWidgetLoaded(false)
      setIsLoadingWidget(false)
    } catch (error) {
      console.error('Error cleaning up widget preview:', error)
      setIsLoadingWidget(false)
    }
  }

  const handlePreviewOpen = () => {
    // Check if we have any API keys
    if (widgetKeys.length === 0) {
      showNotification('No API keys available. Create an API key first.', 'error')
      return
    }
    
    // Auto-select first API key if none is selected
    if (!selectedEmbedKey && widgetKeys.length > 0) {
      console.log('Auto-selecting first API key for preview:', widgetKeys[0].key_name)
      setSelectedEmbedKey(widgetKeys[0])
    }
    
    // Validate selected key
    const keyToUse = selectedEmbedKey || widgetKeys[0]
    if (!keyToUse || !keyToUse.api_key) {
      showNotification('Invalid API key selected. Please select a valid key.', 'error')
      return
    }
    
    console.log('Opening full-page preview with key:', keyToUse.key_name, 'API key:', keyToUse.api_key.substring(0, 12) + '...')
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-white text-2xl font-bold">Chat Widget Configuration</div>
        <div className="text-gray-400">Loading widget configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Chat Widget Configuration</h1>
          <p className="text-gray-400">Manage your website chat widget settings and API keys</p>
        </div>
        <div className="flex space-x-2 relative">
          <Button onClick={handlePreviewOpen} className="bg-slate-600 hover:bg-slate-700 text-white">
            <Eye className="h-4 w-4 mr-2" />
            Preview Widget
          </Button>

          
          {/* Floating Notifications positioned under the button */}
          <div className="absolute top-full right-0 mt-2 z-50 space-y-2 min-w-[250px]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ease-in-out
                  ${notification.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }
                  animate-in slide-in-from-right-5 fade-in-0
                `}
              >
                <div className="flex items-center space-x-2">
                  {notification.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="glass-dark border border-white/10">
          <TabsTrigger value="keys" className="data-[state=active]:bg-blue-500/20">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-blue-500/20">
            <Palette className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-blue-500/20">
            <FileText className="h-4 w-4 mr-2" />
            Contact Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card className="glass-dark border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Widget API Keys</CardTitle>
                <CardDescription className="text-gray-400">
                  Generate unique API keys for different websites or environments
                </CardDescription>
              </div>
              {(user?.role === 'admin' || user?.role === 'super_admin' || user?.widget_access) && (
                <Dialog open={showNewKeyDialog} onOpenChange={(open) => {
                  setShowNewKeyDialog(open)
                  if (open) {
                    // Pre-populate URL when dialog opens
                    setNewKeyUrl(getDefaultUrl())
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-600 hover:bg-slate-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Key
                    </Button>
                  </DialogTrigger>
                <DialogContent className="glass-dark border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New API Key</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Give your API key a descriptive name to identify where it's used.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyName" className="text-gray-300">Key Name</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production Website, Staging Environment"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyUrl" className="text-gray-300">Dynamic URL (Optional)</Label>
                      <Input
                        id="keyUrl"
                        value={newKeyUrl}
                        onChange={(e) => setNewKeyUrl(e.target.value)}
                        placeholder="https://your-ngrok-url.ngrok-free.app"
                        className="glass-input"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use the system default URL. This will be used for widget embed scripts.
                      </p>
                    </div>
                    {user?.role === 'super_admin' && (
                      <div>
                        <Label htmlFor="teamSelect" className="text-gray-300">Team</Label>
                        <Select 
                          value={selectedTeamId === undefined ? undefined : selectedTeamId === null ? 'null' : selectedTeamId.toString()} 
                          onValueChange={(value) => setSelectedTeamId(value === 'null' ? null : parseInt(value))}
                        >
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="Select team for API key" />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-white/10">
                            <div className="p-2 border-b border-white/10">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="Search teams..."
                                  value={teamSearchTerm}
                                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                                  className="pl-8 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-white/20"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-auto">
                              <SelectItem value="null">Super Admin</SelectItem>
                              {filteredTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  {team.name}
                                </SelectItem>
                              ))}
                              {filteredTeams.length === 0 && teamSearchTerm && (
                                <div className="px-2 py-3 text-sm text-gray-400 text-center">
                                  No teams found matching "{teamSearchTerm}"
                                </div>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      setShowNewKeyDialog(false)
                      setTeamSearchTerm('')
                      setNewKeyName('')
                      setNewKeyUrl('')
                      setSelectedTeamId(undefined)
                    }} className="bg-slate-600 hover:bg-slate-700 text-white">
                      Cancel
                    </Button>
                    <Button onClick={createWidgetKey} disabled={creatingKey} className="bg-slate-600 hover:bg-slate-700 text-white">
                      {creatingKey ? 'Creating...' : 'Create Key'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.team_id && user?.role !== 'super_admin' ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400">Team Required</p>
                  <p className="text-gray-500 text-sm">You need to be assigned to a team to manage team-specific widgets</p>
                </div>
              ) : !(user?.role === 'admin' || user?.role === 'super_admin' || user?.widget_access) ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-orange-400">Widget Access Required</p>
                  <p className="text-gray-500 text-sm">You need widget access permission to manage API keys</p>
                </div>
              ) : widgetKeys.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No API keys created yet</p>
                  <p className="text-gray-500 text-sm">Create your first API key to start using the widget</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {widgetKeys.map((key) => (
                    <div 
                      key={key.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmbedKey(key)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-1 min-w-0">
                          {/* Key Name and Status Row */}
                          <div className="flex items-center space-x-3 mb-2">
                            <Key className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <h3 className="text-white font-medium truncate">{key.key_name}</h3>
                            <Badge 
                              className={key.is_active 
                                ? "bg-green-500/20 text-green-300 border-green-400/30" 
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                              }
                            >
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {user?.role === 'super_admin' && key.team_name && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                                {key.team_name}
                              </Badge>
                            )}
                            {selectedEmbedKey?.id === key.id && (
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                                Selected
                              </Badge>
                            )}
                          </div>
                          
                          {/* API Key and Actions Row */}
                          <div className="flex items-center space-x-3 text-sm">
                            <code className="text-gray-300 bg-gray-800/50 px-2 py-1 rounded font-mono flex-shrink-0">
                              {key.api_key.substring(0, 12)}...{key.api_key.substring(key.api_key.length - 4)}
                            </code>
                            <div className="flex items-center space-x-2 text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(key.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(key.api_key, 'API Key')
                          }}
                          className="text-gray-400 hover:text-white h-8 w-8 p-0"
                          title="Copy API Key"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteWidgetKey(key.id, key.key_name)
                          }}
                          className="bg-slate-600 hover:bg-slate-700 text-white h-8 w-8 p-0"
                          title="Delete Key"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEmbedKey && (
            <Card className="glass-dark border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">Widget Embed Code</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                      Copy and paste before the closing &lt;/body&gt; tag
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    {selectedEmbedKey.key_name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto border border-gray-700">
                    <code>{generateEmbedCode(selectedEmbedKey.api_key)}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generateEmbedCode(selectedEmbedKey.api_key), 'Embed Code')}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white h-7 w-7 p-1"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedEmbedKey && (
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings2 className="h-5 w-5 mr-2" />
                  WordPress Plugin
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Generate a custom WordPress plugin for easy installation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-blue-300 font-medium mb-1">One-Click WordPress Integration</h4>
                    <p className="text-gray-400 text-sm">
                      Generate a custom plugin with your current settings and API key: <code className="text-blue-300">{selectedEmbedKey.key_name}</code>
                    </p>
                  </div>
                  <WordPressPluginButton
                    apiKey={selectedEmbedKey.api_key}
                    keyName={selectedEmbedKey.key_name}
                    teamId={selectedEmbedKey.team_id || user?.team_id}
                    serverUrl={selectedEmbedKey.ngrok_url || systemConfig.ngrok_url || getDefaultUrl()}
                    onSuccess={() => showNotification('Plugin generated successfully!')}
                    onError={(error: string) => showNotification(error, 'error')}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card className="glass-dark border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Widget Configuration</CardTitle>
              <CardDescription className="text-gray-400">
                Customize the appearance and behavior of your chat widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Widget Title</Label>
                    <Input
                      id="title"
                      value={widgetConfig.widget_title}
                      onChange={(e) => setWidgetConfig({...widgetConfig, widget_title: e.target.value})}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="button-color" className="text-gray-300">Button Color</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="button-color"
                        type="color"
                        value={widgetConfig.button_color}
                        onChange={(e) => setWidgetConfig({...widgetConfig, button_color: e.target.value})}
                        className="glass-input w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widgetConfig.button_color}
                        onChange={(e) => setWidgetConfig({...widgetConfig, button_color: e.target.value})}
                        placeholder="#FFD700"
                        className="glass-input flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose the color for the "Ask Anything" button
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="button-text-color" className="text-gray-300">Button Text Color</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="button-text-color"
                        type="color"
                        value={widgetConfig.button_text_color}
                        onChange={(e) => setWidgetConfig({...widgetConfig, button_text_color: e.target.value})}
                        className="glass-input w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widgetConfig.button_text_color}
                        onChange={(e) => setWidgetConfig({...widgetConfig, button_text_color: e.target.value})}
                        placeholder="#000000"
                        className="glass-input flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose the color for the "Ask Anything" text
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="welcome" className="text-gray-300">Welcome Message</Label>
                    <Textarea
                      id="welcome"
                      value={widgetConfig.welcome_message}
                      onChange={(e) => setWidgetConfig({...widgetConfig, welcome_message: e.target.value})}
                      className="glass-input"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3">
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button onClick={updateWidgetConfig} className="bg-slate-600 hover:bg-slate-700 text-white">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card className="glass-dark border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Contact Form Questions</CardTitle>
              <CardDescription className="text-gray-400">
                Configure up to 5 custom questions for your contact form. Default is 3 questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {widgetQuestions.map((question, index) => (
                  <div key={index} className="p-4 rounded-lg glass-darker border-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                          Question {index + 1}
                        </Badge>
                        <Switch
                          checked={question.is_required}
                          onCheckedChange={(checked) => updateQuestion(index, 'is_required', checked)}
                        />
                        <Label className="text-gray-300 text-sm">Required</Label>
                      </div>
                      {widgetQuestions.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeQuestion(index)}
                          className="text-red-400 hover:text-red-300 p-1 h-7 w-7"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 text-sm">Question Text</Label>
                        <Input
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          placeholder="e.g., What is your full name?"
                          className="glass-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Field Type</Label>
                        <Select
                          value={question.field_type}
                          onValueChange={(value) => updateQuestion(index, 'field_type', value as WidgetQuestion['field_type'])}
                        >
                          <SelectTrigger className="glass-input mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-white/10">
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {question.field_type === 'select' && (
                      <div className="mt-4">
                        <Label className="text-gray-300 text-sm">Options (comma-separated)</Label>
                        <Input
                          value={question.field_options || ''}
                          onChange={(e) => updateQuestion(index, 'field_options', e.target.value)}
                          placeholder="Option 1, Option 2, Option 3"
                          className="glass-input mt-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {widgetQuestions.length < 5 && (
                    <Button
                      onClick={addQuestion}
                      className="bg-slate-600 hover:bg-slate-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  )}
                </div>
                <Button
                  onClick={updateWidgetQuestions}
                  disabled={questionsLoading}
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                >
                  {questionsLoading ? 'Saving...' : 'Save Questions'}
                </Button>
              </div>
              
              <Alert className="glass-dark border-blue-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-400">
                  These questions will appear in the contact form when triggered by your AI agent.
                  You can have 3-5 questions, with at least 1 being required.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Full Page Preview Mode */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-white text-3xl font-bold">Live Widget Preview</h1>
              <p className="text-gray-400 text-lg mt-1">
                Experience your actual chat widget with real LLM responses. Click the chat button to start!
              </p>
            </div>
            <Button
              onClick={() => setPreviewOpen(false)}
              variant="ghost"
              className="text-white hover:bg-gray-700 px-6 py-3 text-lg"
            >
              ← Back to Dashboard
            </Button>
          </div>
          
          {/* Single Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative" style={{ height: 'calc(100vh - 100px)' }}>
            {/* Static Background - No Scrolling */}
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                  }}
                />
              ))}
            </div>
            
            {/* Simple Scrollable Content */}
            <div className="max-w-4xl mx-auto p-8 relative z-10">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-6xl font-bold text-white mb-4">Livara Chat Widget Demo</h1>
                <p className="text-2xl text-gray-300">Experience intelligent conversations</p>
              </div>

              {/* Widget Notice */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-blue-300 mb-2">🤖 Live Chat Available</h3>
                <p className="text-gray-300">Try our AI assistant using the chat widget in the bottom-right corner</p>
                {selectedEmbedKey && (
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${previewWidgetLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                                            {previewWidgetLoaded ? 'Livara Active' : 'Loading Real Widget'} • {selectedEmbedKey.key_name}
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Widget Preview Area</h2>
                <p className="text-xl text-gray-300 mb-8">This is a demonstration area where you can test your widget functionality.</p>
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pb-12">
                <p className="text-gray-400">© 2025 NeuroMonckey.ai | Livara AI Agent</p>
              </div>
            </div>
            
            {/* Live Widget Preview - Fixed Position - Positioned for Actual Size */}
            <div id="live-widget-preview" className="fixed bottom-8 right-8 z-50">
              {/* Widget will be injected here at actual size (320x420px) */}
              {!selectedEmbedKey ? (
                <div className="bg-white rounded-xl shadow-2xl p-8 text-center border border-red-200" style={{ width: '320px', height: '420px' }}>
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-4xl mb-4">⚠️</div>
                    <div className="text-gray-700 font-medium mb-2">No API Key Selected</div>
                    <div className="text-gray-500 text-sm text-center">
                      Go back to dashboard and click an "Embed" button to select a key for preview
                    </div>
                  </div>
                </div>
              ) : !previewWidgetLoaded ? (
                <div className="bg-white rounded-xl shadow-2xl p-8 text-center border border-blue-200" style={{ width: '320px', height: '420px' }}>
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
                    <div className="text-gray-700 font-medium mb-2">Loading Live Widget</div>
                    <div className="text-gray-500 text-sm text-center">
                      Connecting to your AI...<br/>
                      <span className="text-blue-600 font-medium">{selectedEmbedKey.key_name}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}