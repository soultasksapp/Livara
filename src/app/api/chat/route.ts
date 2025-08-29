import { NextRequest, NextResponse } from 'next/server'
import { requireTeamAccess } from '@/lib/auth'
import { generateLLMResponse } from '@/lib/llm'
import { saveConversation } from '@/lib/database'
import { v4 as uuidv4 } from 'uuid'

export const POST = requireTeamAccess(async (request: NextRequest, user) => {
  try {
    const { message, session_id } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Generate session ID if not provided
    const sessionId = session_id || uuidv4()

    // Generate AI response
    const llmResponse = await generateLLMResponse(message)
    
    if (!llmResponse.success) {
      return NextResponse.json(
        { success: false, error: llmResponse.error || 'Failed to generate response' },
        { status: 500 }
      )
    }

    const aiResponse = llmResponse.response || 'Sorry, I could not generate a response.'

    // Save conversation to database
    try {
      await saveConversation({
        session_id: sessionId,
        user_message: message,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        team_id: user.role === 'admin' ? undefined : user.team_id,
        user_id: user.user_id
      })
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError)
      // Continue with response even if saving fails
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      session_id: sessionId
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})