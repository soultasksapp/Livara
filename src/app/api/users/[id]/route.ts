import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hashPassword } from '@/lib/auth'
import { getUserById, updateUser } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Users can only view their own profile unless they're admin
    if (user.role !== 'admin' && user.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const targetUser = await getUserById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        team_id: targetUser.team_id,
        is_active: targetUser.is_active,
        created_at: targetUser.created_at,
        last_login: targetUser.last_login
      }
    })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const { name, email, password, role, team_id, is_active } = await request.json()

    // Users can only update their own profile (limited fields) unless they're admin
    if (user.role !== 'admin') {
      if (user.user_id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
      // Regular users can only update name and password
      if (role !== undefined || team_id !== undefined || is_active !== undefined) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Check if user exists
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (password !== undefined) updateData.password_hash = await hashPassword(password)
    
    // Admin-only fields
    if (user.role === 'admin') {
      if (role !== undefined) {
        if (!['admin', 'user'].includes(role)) {
          return NextResponse.json(
            { success: false, error: 'Invalid role' },
            { status: 400 }
          )
        }
        updateData.role = role
      }
      if (team_id !== undefined) updateData.team_id = team_id
      if (is_active !== undefined) updateData.is_active = is_active
    }

    const updatedUser = await updateUser(userId, updateData)

    // Log the user update
    await logAuditEvent({
      user_id: user.user_id,
      action: 'update_user',
      entity_type: 'user',
      entity_id: userId,
      details: {
        target_user: existingUser.email,
        changes: Object.keys(updateData).filter(key => key !== 'password_hash')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        team_id: updatedUser.team_id,
        is_active: updatedUser.is_active,
        created_at: updatedUser.created_at,
        last_login: updatedUser.last_login
      }
    })
  } catch (error: unknown) {
    console.error('User update error:', error)
    
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

// DELETE - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    // Check authentication and admin role
    const user = await getAuthenticatedUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (user.user_id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete - deactivate user instead of hard delete
    await updateUser(userId, { is_active: false })

    // Log the user deletion
    await logAuditEvent({
      user_id: user.user_id,
      action: 'delete_user',
      entity_type: 'user',
      entity_id: userId,
      details: { 
        target_user: existingUser.email,
        target_name: existingUser.name
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}