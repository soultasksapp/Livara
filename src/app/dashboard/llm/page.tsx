"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  Settings,
  Key,
  Server,
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
  Save,
  TestTube,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface LLMSettings {
  provider: string
  openai_model: string
  openai_api_key: string
  ollama_url: string
  ollama_model: string
  max_tokens: number
  temperature: number
  custom_instructions: string
}


export default function LLMPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const defaultSettings: LLMSettings = {
    provider: "openai",
    openai_model: "gpt-5-mini",
    openai_api_key: "",
    ollama_url: "http://localhost:11434",
    ollama_model: "qwen2.5:14b-instruct-q4_K_M",
    max_tokens: 2048,
    temperature: 0.7,
    custom_instructions: ""
  }
  
  const [settings, setSettings] = useState<LLMSettings>(() => {
    console.log('[DEBUG] Initializing with default settings:', defaultSettings)
    return defaultSettings
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false)
  const { toast } = useToast()
  
  // Check if user has super admin access
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  // Don't render anything for non-super admins
  if (user && user.role !== 'super_admin') {
    return null
  }

  useEffect(() => {
    console.log('[DEBUG] Component mounted, loading settings...')
    loadSettings()
  }, [])

  useEffect(() => {
    console.log('[DEBUG] Settings changed - Current values:')
    console.log('  - provider:', settings.provider)
    console.log('  - max_tokens:', settings.max_tokens) 
    console.log('  - temperature:', settings.temperature)
    console.log('  - custom_instructions:', settings.custom_instructions)
    console.log('  - Full object:', settings)
    
    if (settings.provider === 'ollama') {
      loadOllamaModels()
    }
  }, [settings])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/llm/settings')
      console.log('[DEBUG] Full API response:', response)
      console.log('[DEBUG] Response data:', response.data)
      console.log('[DEBUG] Response.data type:', typeof response.data)
      console.log('[DEBUG] Response.data keys:', response.data ? Object.keys(response.data) : 'none')
      
      if (response.success && response.data) {
        // Check if data is nested (backend returns {success: true, data: settings})
        const actualData = response.data.data || response.data
        console.log('[DEBUG] Actual settings data:', actualData)
        
        // Use the exact data from backend without overriding with defaults
        const loadedSettings = {
          provider: actualData.provider,
          openai_model: actualData.openai_model,
          openai_api_key: actualData.openai_api_key || "",
          ollama_url: actualData.ollama_url,
          ollama_model: actualData.ollama_model,
          max_tokens: actualData.max_tokens,
          temperature: actualData.temperature,
          custom_instructions: actualData.custom_instructions
        }
        console.log('[DEBUG] Processed settings:', loadedSettings)
        console.log('[DEBUG] About to update state with:', loadedSettings)
        
        // Force a state update with a timeout to ensure it takes
        setTimeout(() => {
          setSettings(loadedSettings)
          console.log('[DEBUG] Settings state updated via timeout')
        }, 100)
        
        setSettings(loadedSettings)
        console.log('[DEBUG] Settings state updated immediately')
      } else {
        console.error('[DEBUG] Invalid response:', response)
      }
    } catch (error) {
      console.error('Failed to load LLM settings:', error)
      toast({
        title: "Error",
        description: (error as Error).message === "Network error occurred" ? "Network error occurred - please check if the server is running" : "Failed to load LLM settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }


  const saveSettings = async () => {
    try {
      setIsSaving(true)
      console.log('[DEBUG] Saving settings:', settings)
      const response = await apiClient.post('/api/llm/settings', settings)
      console.log('[DEBUG] Save response:', response)
      
      if (response.success) {
        const now = new Date().toLocaleTimeString()
        setLastSaved(now)
        toast({
          title: "✅ Settings Saved",
          description: `Agent settings saved successfully at ${now}`,
        })
        // Clear the success indicator after 2.5 seconds with smooth transition
        setTimeout(() => {
          setLastSaved(null)
        }, 2500)
      } else {
        throw new Error(response.error || response.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save LLM settings:', error)
      toast({
        title: "Error",
        description: (error as Error).message === "Network error occurred" ? "Network error occurred - please check if the server is running" : ((error as Error).message || "Failed to save LLM settings"),
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const loadOllamaModels = async () => {
    if (settings.provider !== 'ollama') return
    
    try {
      setLoadingOllamaModels(true)
      const response = await apiClient.get('/api/ollama/models')
      if (response.success) {
        setOllamaModels(response.data.models || [])
      } else {
        console.error('Failed to load Ollama models:', response.error)
      }
    } catch (error) {
      console.error('Error loading Ollama models:', error)
    } finally {
      setLoadingOllamaModels(false)
    }
  }

  const testConnection = async () => {
    try {
      setConnectionStatus('unknown')
      const response = await apiClient.post('/api/llm/test', { provider: settings.provider })
      if (response.success) {
        setConnectionStatus('connected')
        toast({
          title: "Success",
          description: "Connection test successful",
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: "Connection Failed",
          description: response.error || "Unable to connect to LLM provider",
          variant: "destructive"
        })
      }
    } catch (error) {
      setConnectionStatus('error')
      toast({
        title: "Connection Error",
        description: "Failed to test connection",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 glass-dark border-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 glass-dark border-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Agent Controls
          </h1>
          <p className="text-gray-400 mt-1">Configure language model providers and settings</p>
        </div>
        <div className="flex items-center gap-3">
          {connectionStatus === 'connected' && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-400/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
          <Button
            onClick={testConnection}
            size="sm"
            className="bg-slate-600 hover:bg-slate-700 text-white"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
        </div>
      </div>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 glass-dark border-white/10">
          <TabsTrigger value="provider" className="text-gray-300">Provider & Models</TabsTrigger>
          <TabsTrigger value="parameters" className="text-gray-300">Parameters</TabsTrigger>
          <TabsTrigger value="instructions" className="text-gray-300">Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Selection */}
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-400" />
                  Provider Selection
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose your AI language model provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Provider</Label>
                  <Select value={settings.provider} onValueChange={(value) => setSettings({...settings, provider: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dark border-white/10">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {settings.provider === 'openai' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">OpenAI API Key</Label>
                                          <Input
                        type="password"
                        value={settings.openai_api_key || ""}
                        onChange={(e) => setSettings({...settings, openai_api_key: e.target.value})}
                        placeholder="sk-..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                  </div>
                )}

                {settings.provider === 'ollama' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Ollama URL</Label>
                    <Input
                      value={settings.ollama_url || "http://localhost:11434"}
                      onChange={(e) => setSettings({...settings, ollama_url: e.target.value})}
                      placeholder="http://localhost:11434"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Info */}
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  Provider Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settings.provider === 'openai' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                      <h4 className="text-blue-300 font-medium">OpenAI</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Cloud-based AI models with high performance and reliability. Requires API key.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Models Available:</span>
                        <span className="text-white">GPT-4, GPT-4o Mini, GPT-5, GPT-5 Mini</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pricing:</span>
                        <span className="text-white">Pay per token</span>
                      </div>
                    </div>
                  </div>
                )}

                {settings.provider === 'ollama' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
                      <h4 className="text-purple-300 font-medium">Ollama</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Run large language models locally. Free but requires local installation.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Models Available:</span>
                        <span className="text-white">Llama, Qwen, Mistral</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pricing:</span>
                        <span className="text-white">Free</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Configuration */}
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-400" />
                  Model Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select and configure the AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.provider === 'openai' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">OpenAI Model</Label>
                    <Select value={settings.openai_model} onValueChange={(value) => setSettings({...settings, openai_model: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dark border-white/10">
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                        <SelectItem value="gpt-5">GPT-5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.provider === 'ollama' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Ollama Model</Label>
                      <Button
                        size="sm"
                        onClick={loadOllamaModels}
                        disabled={loadingOllamaModels}
                        className="bg-slate-600 hover:bg-slate-700 text-white h-8 px-3"
                      >
                        {loadingOllamaModels ? (
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Refresh"
                        )}
                      </Button>
                    </div>
                    {ollamaModels.length > 0 ? (
                      <Select value={settings.ollama_model} onValueChange={(value) => setSettings({...settings, ollama_model: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dark border-white/10">
                          {ollamaModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={settings.ollama_model || "qwen2.5:14b-instruct-q4_K_M"}
                        onChange={(e) => setSettings({...settings, ollama_model: e.target.value})}
                        placeholder="qwen2.5:14b-instruct-q4_K_M"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    )}
                    {ollamaModels.length === 0 && !loadingOllamaModels && (
                      <p className="text-xs text-gray-500">No models found. Make sure Ollama is running and has models installed.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Configuration */}
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Current Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-12 glass-dark border-white/10 rounded-lg animate-pulse" />
                    <div className="h-12 glass-dark border-white/10 rounded-lg animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-300 font-medium">Provider</span>
                        <span className="text-white">{settings.provider?.toUpperCase() || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 font-medium">Model</span>
                        <span className="text-white text-sm">
                          {settings.provider === 'openai' ? (settings.openai_model || 'Not selected') : (settings.ollama_model || 'Not selected')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Generation Parameters
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Fine-tune the AI response behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Max Tokens</Label>
                  <Input
                    type="number"
                    value={settings.max_tokens || 2048}
                    onChange={(e) => setSettings({...settings, max_tokens: parseInt(e.target.value) || 2048})}
                    min="1"
                    max="4096"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-500">Maximum length of the AI response</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Temperature: {settings.temperature || 0.7}</Label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.temperature || 0.7}
                    onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Parameter Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <h4 className="text-blue-300 font-medium text-sm">Max Tokens</h4>
                    <p className="text-gray-400 text-xs">
                      Controls response length. Higher values allow longer responses but cost more.
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
                    <h4 className="text-purple-300 font-medium text-sm">Temperature</h4>
                    <p className="text-gray-400 text-xs">
                      0.0 = Deterministic, 1.0 = Balanced, 2.0 = Very creative
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-6">
          <Card className="glass-dark border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Custom System Instructions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Define how the AI should behave and respond to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={settings.custom_instructions || ""}
                onChange={(e) => setSettings({...settings, custom_instructions: e.target.value})}
                placeholder="You are a helpful AI assistant for customer support. Be professional, friendly, and concise in your responses..."
                rows={8}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                These instructions will be prepended to every conversation to guide the AI's behavior.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Separator className="bg-white/10" />

      <div className="flex justify-end items-center gap-3">
        {lastSaved && (
          <div className="text-sm text-green-500 flex items-center gap-1 transition-all duration-300 ease-in-out animate-in slide-in-from-left-2 fade-in">
            <CheckCircle className="h-4 w-4 transition-transform duration-300 ease-in-out" />
            <span className="transition-opacity duration-300">Saved at {lastSaved}</span>
          </div>
        )}
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-slate-600 hover:bg-slate-700 text-white font-medium transition-all duration-500 ease-in-out w-36"
        >
          <div className="flex items-center transition-all duration-300 ease-in-out">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 transition-opacity duration-200"></div>
                <span className="transition-opacity duration-200">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 transition-all duration-300 ease-in-out animate-in zoom-in-50" />
                <span className="transition-opacity duration-300">Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 transition-all duration-300 ease-in-out" />
                <span className="transition-opacity duration-300">Save Settings</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
} 