import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createJWT } from '@/lib/auth'
import { logAuditEvent } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await createJWT({
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      team_id: user.team_id
    })

    // Log the login event
    await logAuditEvent({
      user_id: user.id,
      action: 'login',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        team_id: user.team_id
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}