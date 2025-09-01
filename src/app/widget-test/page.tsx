"use client"

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function WidgetTestContent() {
  const searchParams = useSearchParams()
  const apiKey = searchParams.get('api_key')

  useEffect(() => {
    if (!apiKey) {
      console.error('No API key provided for widget test')
      return
    }

    // Dynamically load the widget script
    const script = document.createElement('script')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3034'
    script.src = `${apiUrl}/widget/${apiKey}.js`
    script.async = true
    script.onerror = function() {
      console.error('Failed to load widget script')
      const errorDiv = document.getElementById('error-message')
      if (errorDiv) {
        errorDiv.style.display = 'block'
      }
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup: remove script and widget elements
      document.head.removeChild(script)
      const chatContainer = document.getElementById('livara-chat-container')
      const toggleContainer = document.getElementById('chat-toggle-container')
      if (chatContainer) chatContainer.remove()
      if (toggleContainer) toggleContainer.remove()
    }
  }, [apiKey])

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Test URL</h1>
          <p className="text-gray-600">No API key provided. Please use the "Test Live Widget" button from the widget configuration page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Widget Test Page</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">API Key: {apiKey?.substring(0, 8)}...</span>
              <button 
                onClick={() => window.close()}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Widget Test Environment</h2>
            <p className="text-gray-600 mb-4">
              This page simulates how your chat widget will appear on a real website. 
              The widget should appear in the bottom-right corner of the page.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-medium text-blue-900 mb-2">Test Checklist:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Widget appears in the correct position</li>
                <li>✓ Colors match your configuration</li>
                <li>✓ Chat functionality works</li>
                <li>✓ Contact form appears when triggered</li>
                <li>✓ Messages are sent and received</li>
              </ul>
            </div>
          </div>

          {/* Sample Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">About Our Service</h3>
              <p className="text-gray-600 mb-4">
                Welcome to our website! We provide excellent customer service and support. 
                Feel free to chat with our AI assistant using the widget in the bottom-right corner.
              </p>
              <p className="text-gray-600">
                Try asking questions like:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>"What services do you offer?"</li>
                <li>"I need help with my account"</li>
                <li>"Can I speak to a human agent?"</li>
                <li>"Request a call back"</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-2 text-gray-600">
                <p>📧 Email: support@example.com</p>
                <p>📞 Phone: (555) 123-4567</p>
                <p>🕒 Hours: Mon-Fri 9AM-5PM</p>
                <p>📍 Address: 123 Business St, City, State 12345</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div 
            id="error-message" 
            className="mt-6 bg-red-50 border border-red-200 rounded p-4" 
            style={{ display: 'none' }}
          >
            <h3 className="font-medium text-red-900 mb-2">Widget Loading Error</h3>
            <p className="text-sm text-red-800">
              Failed to load the chat widget. Please check:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
              <li>API key is valid and active</li>
                              <li>Server is running on http://localhost:3034</li>
              <li>Team configuration is properly set up</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            This is a test environment for your Livara ChatBot widget.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function WidgetTestPage() {
  return (
    <Suspense fallback={null}>
      <WidgetTestContent />
    </Suspense>
  )
}