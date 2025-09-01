import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllUsers, createUser } from '@/lib/database'
import { hashPassword } from '@/lib/auth'

export const GET = requireAdmin(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    
    const users = await getAllUsers(teamId ? parseInt(teamId, 10) : undefined)

    return NextResponse.json({
      success: true,
      data: {
        users: users
      }
    })
  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const userData = await request.json()

    if (!userData.email || !userData.password || !userData.name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Hash the password
    const password_hash = await hashPassword(userData.password)

    const newUser = await createUser({
      email: userData.email,
      password_hash,
      name: userData.name,
      role: userData.role || 'user',
      team_id: userData.team_id || null,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      last_login: undefined
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        team_id: newUser.team_id,
        is_active: newUser.is_active,
        created_at: newUser.created_at
      }
    })
  } catch (error: unknown) {
    console.error('Admin user creation error:', error)
    
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
})