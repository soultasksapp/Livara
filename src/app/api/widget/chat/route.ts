import { NextRequest, NextResponse } from 'next/server'
import { validateWidgetKey, incrementWidgetKeyUsage, saveConversation, getTeamLlmSettings } from '@/lib/database'
import { generateLLMResponse } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json()
    
    if (!message || !session_id) {
      return NextResponse.json(
        { success: false, error: 'Missing message or session_id' },
        { status: 400 }
      )
    }

    // Get API key from header
    const apiKey = request.headers.get('x-widget-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing API key' },
        { status: 401 }
      )
    }

    // Validate API key and get team info
    const teamInfo = await validateWidgetKey(apiKey)
    if (!teamInfo) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 403 }
      )
    }

    const teamId = teamInfo.team_id
    const teamName = teamInfo.teams?.name || 'Unknown Team'

    // Increment usage counter
    await incrementWidgetKeyUsage(apiKey)

    // Get team's LLM settings
    const llmSettings = await getTeamLlmSettings(teamId)
    
    if (!llmSettings) {
      return NextResponse.json(
        { success: false, error: 'LLM settings not configured for team' },
        { status: 500 }
      )
    }

    // Generate LLM response
    const response = await generateLLMResponse({
      message,
      provider: llmSettings.provider,
      model: llmSettings.model,
      apiKey: llmSettings.api_key,
      systemPrompt: llmSettings.system_prompt,
      temperature: llmSettings.temperature,
      maxTokens: llmSettings.max_tokens,
      baseUrl: llmSettings.base_url
    })

    if (!response.success) {
      console.error('LLM generation failed:', response.error)
      return NextResponse.json(
        { success: false, error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Save conversation to database
    await saveConversation({
      team_id: teamId,
      session_id,
      user_message: message,
      ai_response: response.response || '',
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      response: response.response,
      session_id,
      team_name: teamName
    })

  } catch (error) {
    console.error('Widget chat error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Widget-API-Key'
    }
  })
}