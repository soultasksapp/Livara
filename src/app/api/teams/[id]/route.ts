import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth'
import { getTeamById, updateTeam, deleteTeam } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const teamId = parseInt(resolvedParams.id)
    if (isNaN(teamId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        is_active: team.is_active,
        created_at: team.created_at,
        created_by: team.created_by
      }
    })
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update team (admin only)
export async function PUT(
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

    const teamId = parseInt(resolvedParams.id)
    if (isNaN(teamId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    const { name, description, is_active } = await request.json()

    // Check if team exists
    const existingTeam = await getTeamById(teamId)
    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const updatedTeam = await updateTeam(teamId, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active })
    })

    // Log the team update
    await logAuditEvent({
      user_id: user.user_id,
      action: 'update_team',
      entity_type: 'team',
      entity_id: teamId,
      details: { 
        old_name: existingTeam.name,
        new_name: name,
        changes: { name, description, is_active }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        is_active: updatedTeam.is_active,
        created_at: updatedTeam.created_at
      }
    })
  } catch (error: any) {
    console.error('Team update error:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Team name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete team (admin only)
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

    const teamId = parseInt(resolvedParams.id)
    if (isNaN(teamId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    // Check if team exists
    const existingTeam = await getTeamById(teamId)
    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    await deleteTeam(teamId)

    // Log the team deletion
    await logAuditEvent({
      user_id: user.user_id,
      action: 'delete_team',
      entity_type: 'team',
      entity_id: teamId,
      details: { team_name: existingTeam.name }
    })

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
}