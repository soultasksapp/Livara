import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createTeam, getAllTeams, updateUser } from '@/lib/database'

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    // Check if user already has a team
    if (user.team_id) {
      return NextResponse.json({
        success: true,
        message: 'User already has team assigned',
        team_id: user.team_id
      })
    }

    // Check if there are any teams
    const existingTeams = await getAllTeams()
    
    let defaultTeam
    if (existingTeams.length === 0) {
      // Create default admin team
      defaultTeam = await createTeam({
        name: 'Default Admin Team',
        description: 'Default team for system administrators',
        is_active: true,
        created_by: user.user_id
      })
    } else {
      // Use the first existing team
      defaultTeam = existingTeams[0]
    }

    // Assign user to the team
    await updateUser(user.user_id, { team_id: defaultTeam.id })

    return NextResponse.json({
      success: true,
      message: 'Team assigned successfully',
      team_id: defaultTeam.id,
      team_name: defaultTeam.name
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})