import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { createTeam, getAllTeams, updateTeam, getTeamById } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - List all teams (admin only) or user's team
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    if (user.role === 'admin') {
      const teams = await getAllTeams()
      return NextResponse.json({
        success: true,
        teams: teams.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description,
          is_active: team.is_active,
          created_at: team.created_at,
          created_by: team.created_by
        }))
      })
    } else if (user.team_id) {
      // Regular users can only see their own team
      const team = await getTeamById(user.team_id)
      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        teams: [{
          id: team.id,
          name: team.name,
          description: team.description,
          is_active: team.is_active,
          created_at: team.created_at
        }]
      })
    } else {
      return NextResponse.json({
        success: true,
        teams: []
      })
    }
  } catch (error) {
    console.error('Teams GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST - Create new team (admin only)
export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    const newTeam = await createTeam({
      name,
      description: description || null,
      is_active: true,
      created_by: user.user_id
    })

    // Log the team creation
    await logAuditEvent({
      user_id: user.user_id,
      action: 'create_team',
      entity_type: 'team',
      entity_id: newTeam.id,
      details: { team_name: name }
    })

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: {
        id: newTeam.id,
        name: newTeam.name,
        description: newTeam.description,
        is_active: newTeam.is_active,
        created_at: newTeam.created_at
      }
    })
  } catch (error: any) {
    console.error('Team creation error:', error)
    
    // Handle unique constraint violation
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
})