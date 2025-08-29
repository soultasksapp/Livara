import { NextRequest, NextResponse } from 'next/server'
import { validateWidgetKey, incrementWidgetKeyUsage, getWidgetConfig } from '@/lib/database'

// Generate widget JavaScript for embedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const resolvedParams = await params
  const apiKey = resolvedParams.key

  try {
    // Validate API key and get team info
    const teamInfo = await validateWidgetKey(apiKey)
    
    if (!teamInfo) {
      return new NextResponse(
        `console.error('Invalid widget API key: ${apiKey.substring(0, 12)}...');`,
        {
          status: 404,
          headers: { 'Content-Type': 'application/javascript' }
        }
      )
    }

    const teamId = teamInfo.team_id
    const teamName = teamInfo.teams?.name || 'Unknown Team'

    // Get widget configuration
    const config = await getWidgetConfig(teamId)
    
    if (!config) {
      return new NextResponse(
        `console.error('Widget configuration not found for team: ${teamId}');`,
        {
          status: 404,
          headers: { 'Content-Type': 'application/javascript' }
        }
      )
    }

    // Increment usage counter
    await incrementWidgetKeyUsage(apiKey)

    // Generate the widget JavaScript
    const widgetJs = generateWidgetScript({
      apiKey,
      teamId,
      teamName,
      config,
      baseUrl: getBaseUrl(request)
    })

    return new NextResponse(widgetJs, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Widget generation error:', error)
    return new NextResponse(
      `console.error('Widget generation failed: ${error}');`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/javascript' }
      }
    )
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  return `${protocol}://${host}`
}

function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function generateWidgetScript(options: {
  apiKey: string
  teamId: number | null
  teamName: string
  config: any
  baseUrl: string
}): string {
  const { apiKey, teamId, teamName, config, baseUrl } = options

  return `
(function() {
    // Prevent multiple widget instances
    if (window.livaraWidget) {
        return;
    }
    window.livaraWidget = true;

    // Widget configuration
    const WIDGET_CONFIG = {
        teamId: ${teamId || 'null'},
        teamName: '${escapeJsString(teamName)}',
        apiKey: '${escapeJsString(apiKey)}',
        baseUrl: '${escapeJsString(baseUrl)}',
        title: '${escapeJsString(config.widget_title || 'Chat with AI')}',
        subtitle: '${escapeJsString(config.widget_subtitle || 'We are here to help')}',
        welcomeMessage: '${escapeJsString(config.welcome_message || 'Hello! How can I help you today?')}',
        placeholder: '${escapeJsString(config.input_placeholder || 'Type your message...')}',
        primaryColor: '${escapeJsString(config.primary_color || '#007bff')}',
        secondaryColor: '${escapeJsString(config.secondary_color || '#6c757d')}',
        position: '${escapeJsString(config.widget_position || 'bottom-right')}',
        showAvatar: ${config.show_avatar !== false},
        showPoweredBy: ${config.show_powered_by !== false}
    };

    // Session management
    let sessionId = localStorage.getItem('livara_chat_session');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('livara_chat_session', sessionId);
    }

    // Widget styles
    const styles = \`
        <style id="livara-widget-styles">
            .livara-chat-widget * {
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            .livara-chat-bubble {
                position: fixed;
                z-index: 9999;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: \${WIDGET_CONFIG.primaryColor};
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .livara-chat-bubble:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0,0,0,0.2);
            }
            
            .livara-chat-bubble.bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .livara-chat-bubble.bottom-left {
                bottom: 20px;
                left: 20px;
            }
            
            .livara-chat-bubble.top-right {
                top: 20px;
                right: 20px;
            }
            
            .livara-chat-bubble.top-left {
                top: 20px;
                left: 20px;
            }
            
            .livara-chat-widget {
                position: fixed;
                z-index: 10000;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            .livara-chat-widget.show {
                display: flex;
            }
            
            .livara-chat-widget.bottom-right {
                bottom: 90px;
                right: 20px;
            }
            
            .livara-chat-widget.bottom-left {
                bottom: 90px;
                left: 20px;
            }
            
            .livara-chat-widget.top-right {
                top: 90px;
                right: 20px;
            }
            
            .livara-chat-widget.top-left {
                top: 90px;
                left: 20px;
            }
            
            .livara-chat-header {
                background: \${WIDGET_CONFIG.primaryColor};
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .livara-chat-header-content {
                flex: 1;
            }
            
            .livara-chat-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }
            
            .livara-chat-subtitle {
                font-size: 12px;
                opacity: 0.9;
                margin: 2px 0 0 0;
            }
            
            .livara-chat-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .livara-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8f9fa;
            }
            
            .livara-chat-message {
                margin-bottom: 12px;
                display: flex;
                max-width: 80%;
            }
            
            .livara-chat-message.user {
                justify-content: flex-end;
                margin-left: auto;
            }
            
            .livara-chat-message.bot {
                justify-content: flex-start;
            }
            
            .livara-chat-message-content {
                padding: 10px 14px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .livara-chat-message.user .livara-chat-message-content {
                background: \${WIDGET_CONFIG.primaryColor};
                color: white;
            }
            
            .livara-chat-message.bot .livara-chat-message-content {
                background: white;
                color: #333;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .livara-chat-input-area {
                padding: 16px;
                background: white;
                border-top: 1px solid #e9ecef;
            }
            
            .livara-chat-input-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .livara-chat-input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                outline: none;
                resize: none;
                min-height: 40px;
                max-height: 120px;
            }
            
            .livara-chat-input:focus {
                border-color: \${WIDGET_CONFIG.primaryColor};
            }
            
            .livara-chat-send {
                background: \${WIDGET_CONFIG.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: opacity 0.2s;
            }
            
            .livara-chat-send:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .livara-chat-powered-by {
                text-align: center;
                font-size: 11px;
                color: #999;
                margin-top: 8px;
            }
            
            .livara-chat-powered-by a {
                color: \${WIDGET_CONFIG.primaryColor};
                text-decoration: none;
            }
            
            .livara-typing-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 10px 14px;
                background: white;
                border-radius: 18px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .livara-typing-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #999;
                animation: livara-typing 1.4s infinite ease-in-out both;
            }
            
            .livara-typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .livara-typing-dot:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes livara-typing {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1);
                }
            }
            
            @media (max-width: 768px) {
                .livara-chat-widget {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 120px);
                    max-width: 350px;
                    max-height: 500px;
                }
            }
        </style>
    \`;

    // Add styles to document head
    document.head.insertAdjacentHTML('beforeend', styles);

    // Create widget HTML
    const widgetHTML = \`
        <div class="livara-chat-widget \${WIDGET_CONFIG.position}" id="livara-chat-widget">
            <div class="livara-chat-header">
                <div class="livara-chat-header-content">
                    <h3 class="livara-chat-title">\${WIDGET_CONFIG.title}</h3>
                    <p class="livara-chat-subtitle">\${WIDGET_CONFIG.subtitle}</p>
                </div>
                <button class="livara-chat-close" id="livara-chat-close">×</button>
            </div>
            <div class="livara-chat-messages" id="livara-chat-messages">
                <div class="livara-chat-message bot">
                    <div class="livara-chat-message-content">
                        \${WIDGET_CONFIG.welcomeMessage}
                    </div>
                </div>
            </div>
            <div class="livara-chat-input-area">
                <div class="livara-chat-input-container">
                    <textarea 
                        class="livara-chat-input" 
                        id="livara-chat-input" 
                        placeholder="\${WIDGET_CONFIG.placeholder}"
                        rows="1"
                    ></textarea>
                    <button class="livara-chat-send" id="livara-chat-send">
                        &#8250;
                    </button>
                </div>
                \${WIDGET_CONFIG.showPoweredBy ? '<div class="livara-chat-powered-by">Powered by <a href="https://livara.com" target="_blank">Livara</a></div>' : ''}
            </div>
        </div>
        <div class="livara-chat-bubble \${WIDGET_CONFIG.position}" id="livara-chat-bubble">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
        </div>
    \`;

    // Add widget to page
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Widget functionality
    const chatWidget = document.getElementById('livara-chat-widget');
    const chatBubble = document.getElementById('livara-chat-bubble');
    const chatClose = document.getElementById('livara-chat-close');
    const chatMessages = document.getElementById('livara-chat-messages');
    const chatInput = document.getElementById('livara-chat-input');
    const chatSend = document.getElementById('livara-chat-send');

    let isOpen = false;

    // Toggle widget
    function toggleWidget() {
        isOpen = !isOpen;
        chatWidget.classList.toggle('show', isOpen);
        if (isOpen) {
            chatInput.focus();
        }
    }

    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();

        // Send to API
        fetch(\`\${WIDGET_CONFIG.baseUrl}/api/widget/chat\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Widget-API-Key': WIDGET_CONFIG.apiKey
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            })
        })
        .then(response => response.json())
        .then(data => {
            hideTypingIndicator();
            if (data.success) {
                addMessage(data.response, 'bot');
            } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        })
        .catch(error => {
            console.error('Chat error:', error);
            hideTypingIndicator();
            addMessage('Sorry, I could not connect to the server. Please try again.', 'bot');
        });
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = \`livara-chat-message \${sender}\`;
        messageDiv.innerHTML = \`
            <div class="livara-chat-message-content">\${escapeHtml(text)}</div>
        \`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'livara-chat-message bot';
        typingDiv.id = 'livara-typing-indicator';
        typingDiv.innerHTML = \`
            <div class="livara-typing-indicator">
                <div class="livara-typing-dot"></div>
                <div class="livara-typing-dot"></div>
                <div class="livara-typing-dot"></div>
            </div>
        \`;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('livara-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-resize textarea
    function autoResize() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    }

    // Event listeners
    chatBubble.addEventListener('click', toggleWidget);
    chatClose.addEventListener('click', toggleWidget);
    chatSend.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    chatInput.addEventListener('input', autoResize);

    // Close widget when clicking outside
    document.addEventListener('click', function(e) {
        if (isOpen && !chatWidget.contains(e.target) && !chatBubble.contains(e.target)) {
            toggleWidget();
        }
    });

    console.log('Livara chat widget loaded successfully');
})();
`.trim()
}