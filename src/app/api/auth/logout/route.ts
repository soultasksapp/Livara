import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { logAuditEvent } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (user) {
      // Log the logout event
      await logAuditEvent({
        user_id: user.user_id,
        action: 'logout',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}