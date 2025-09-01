import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserById, updateUser } from '@/lib/database'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const userProfile = await getUserById(user.user_id)
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        team_id: userProfile.team_id,
        is_active: userProfile.is_active,
        created_at: userProfile.created_at,
        profile_color: userProfile.profile_color
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const updates = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'profile_color']
    const filteredUpdates: any = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUser(user.user_id, filteredUpdates)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        team_id: updatedUser.team_id,
        profile_color: updatedUser.profile_color
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})