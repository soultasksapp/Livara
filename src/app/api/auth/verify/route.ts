import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        team_id: user.team_id
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}