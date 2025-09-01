import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateTeam, deleteTeam, getTeamById } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(async (req: NextRequest, user) => {
    try {
      const id = parseInt(params.id, 10)
      const updates = await request.json()

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid team ID' },
          { status: 400 }
        )
      }

      const updatedTeam = await updateTeam(id, updates)

      return NextResponse.json({
        success: true,
        data: updatedTeam
      })
    } catch (error) {
      console.error('Team update error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(async (req: NextRequest, user) => {
    try {
      const id = parseInt(params.id, 10)

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid team ID' },
          { status: 400 }
        )
      }

      await deleteTeam(id)

      return NextResponse.json({
        success: true,
        message: 'Team deleted successfully'
      })
    } catch (error) {
      console.error('Team deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAdmin(async (req: NextRequest, user) => {
    try {
      const id = parseInt(params.id, 10)

      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid team ID' },
          { status: 400 }
        )
      }

      const team = await getTeamById(id)

      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: team
      })
    } catch (error) {
      console.error('Team fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}