import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/database'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'user', team_id } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Hash the password
    const password_hash = await hashPassword(password)

    // Create the user
    const newUser = await createUser({
      email,
      password_hash,
      name,
      role,
      team_id: team_id || null,
      is_active: true,
      last_login: undefined
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        team_id: newUser.team_id
      }
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    // Handle unique constraint violation (duplicate email)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}