import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '@/lib/database'

export const GET = requireAdmin(async (request: NextRequest, user) => {
  try {
    const teams = await getAllTeams()

    return NextResponse.json({
      success: true,
      data: {
        teams: teams
      }
    })
  } catch (error) {
    console.error('Admin teams fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const teamData = await request.json()

    if (!teamData.name) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    const newTeam = await createTeam({
      name: teamData.name,
      description: teamData.description || null,
      is_active: teamData.is_active !== undefined ? teamData.is_active : true,
      created_by: user.user_id
    })

    return NextResponse.json({
      success: true,
      data: newTeam
    })
  } catch (error) {
    console.error('Admin team creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = requireAdmin(async (request: NextRequest, user) => {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const updatedTeam = await updateTeam(id, updates)

    return NextResponse.json({
      success: true,
      data: updatedTeam
    })
  } catch (error) {
    console.error('Admin team update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = requireAdmin(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    await deleteTeam(parseInt(id, 10))

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    })
  } catch (error) {
    console.error('Admin team deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})