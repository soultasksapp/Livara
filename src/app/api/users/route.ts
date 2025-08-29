import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, hashPassword } from '@/lib/auth'
import { createUser, getAllUsers, updateUser } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - List all users (admin) or team users
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')

    let users
    if (user.role === 'admin') {
      users = await getAllUsers(teamId ? parseInt(teamId) : undefined)
    } else if (user.team_id) {
      users = await getAllUsers(user.team_id)
    } else {
      users = []
    }

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        team_id: u.team_id,
        is_active: u.is_active,
        created_at: u.created_at,
        last_login: u.last_login
      }))
    })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST - Create new user (admin only)
export const POST = requireAdmin(async (request: NextRequest, user) => {
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

    // Log the user creation
    await logAuditEvent({
      user_id: user.user_id,
      action: 'create_user',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { 
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        team_id: newUser.team_id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        team_id: newUser.team_id,
        is_active: newUser.is_active,
        created_at: newUser.created_at
      }
    })
  } catch (error: any) {
    console.error('User creation error:', error)
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
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
})