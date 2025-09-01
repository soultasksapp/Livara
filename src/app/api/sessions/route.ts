import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let conversations

    if (user.role === 'admin' || user.role === 'super_admin') {
      // Admin can see all sessions across all teams
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('session_id, timestamp, user_message, ai_response')
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      conversations = data || []
    } else if (user.team_id) {
      // Regular users see only their team's sessions
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('session_id, timestamp, user_message, ai_response')
        .eq('team_id', user.team_id)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      conversations = data || []
    } else {
      // For users without teams, return empty sessions
      conversations = []
    }

    // Group conversations by session_id
    const sessionsMap = new Map()
    
    conversations.forEach(conv => {
      if (!sessionsMap.has(conv.session_id)) {
        sessionsMap.set(conv.session_id, {
          session_id: conv.session_id,
          started_at: conv.timestamp,
          last_activity: conv.timestamp,
          message_count: 0,
          status: 'completed' // Default status
        })
      }
      
      const session = sessionsMap.get(conv.session_id)
      session.message_count++
      
      // Update last activity if this message is newer
      if (conv.timestamp > session.last_activity) {
        session.last_activity = conv.timestamp
      }
      
      // Update started_at if this message is older
      if (conv.timestamp < session.started_at) {
        session.started_at = conv.timestamp
      }
    })

    const sessions = Array.from(sessionsMap.values())

    // Filter by status if specified
    const filteredSessions = status === 'all' ? sessions : 
      sessions.filter(s => s.status === status)

    return NextResponse.json({
      success: true,
      data: filteredSessions
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})