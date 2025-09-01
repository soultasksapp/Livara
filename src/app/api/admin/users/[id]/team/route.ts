import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateUser, getUserById } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(async (req: NextRequest, user) => {
    try {
      const userId = parseInt(params.id, 10)
      const { team_id } = await request.json()

      if (isNaN(userId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
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

      // Update user's team assignment
      const updatedUser = await updateUser(userId, { team_id })

      return NextResponse.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          team_id: updatedUser.team_id
        }
      })
    } catch (error) {
      console.error('User team assignment error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}