import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getConversationsByTeam, saveConversation } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const limitNumber = limit ? parseInt(limit, 10) : 100

    let conversations

    if (user.role === 'admin' || user.role === 'super_admin') {
      // Admin can see all conversations across all teams
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limitNumber)
      
      if (error) throw error
      conversations = data || []
    } else if (user.team_id) {
      conversations = await getConversationsByTeam(user.team_id, limitNumber)
    } else {
      // For users without teams, return empty array instead of error
      conversations = []
    }

    return NextResponse.json({
      success: true,
      data: conversations
    })
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const conversationData = await request.json()

    const newConversation = await saveConversation({
      ...conversationData,
      team_id: user.team_id || null
    })

    return NextResponse.json({
      success: true,
      data: newConversation
    })
  } catch (error) {
    console.error('Conversation save error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})