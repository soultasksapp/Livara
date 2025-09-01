import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    let conversations

    if (user.role === 'admin' || user.role === 'super_admin') {
      // Admin can see stats for all teams
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('session_id, timestamp')
      
      if (error) throw error
      conversations = data
    } else if (user.team_id) {
      // Regular users see only their team's stats
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('session_id, timestamp')
        .eq('team_id', user.team_id)
      
      if (error) throw error
      conversations = data
    } else {
      // For users without teams, return empty stats
      conversations = []
    }

    // Calculate stats
    const uniqueSessions = new Set(conversations?.map(c => c.session_id) || [])
    const totalSessions = uniqueSessions.size
    const totalConversations = conversations?.length || 0

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0]
    const todayConversations = conversations?.filter(c => 
      c.timestamp?.startsWith(today)
    ).length || 0

    const todaySessions = new Set(
      conversations?.filter(c => c.timestamp?.startsWith(today))
        .map(c => c.session_id) || []
    ).size

    return NextResponse.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        total_conversations: totalConversations,
        today_sessions: todaySessions,
        today_conversations: todayConversations,
        average_conversations_per_session: totalSessions > 0 ? 
          Math.round((totalConversations / totalSessions) * 100) / 100 : 0
      }
    })
  } catch (error) {
    console.error('Sessions stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})