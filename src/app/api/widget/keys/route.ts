import { NextRequest, NextResponse } from 'next/server'
import { requireTeamAccess } from '@/lib/auth'
import { createWidgetKey, getTeamWidgetKeys } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'
import * as crypto from 'crypto'

function generateApiKey(): string {
  return 'lw_' + crypto.randomBytes(32).toString('hex')
}

// GET - Get widget API keys for team
export async function GET(request: NextRequest) {
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const teamId = searchParams.get('team_id')
      
      // Use user's team_id if not admin or if no team_id provided
      const targetTeamId = user.role === 'admin' && teamId ? parseInt(teamId) : user.team_id
      
      if (!targetTeamId) {
        return NextResponse.json(
          { success: false, error: 'No team specified' },
          { status: 400 }
        )
      }

      const keys = await getTeamWidgetKeys(targetTeamId)
      
      return NextResponse.json({
        success: true,
        keys: keys.map(key => ({
          id: key.id,
          api_key: key.api_key.substring(0, 8) + '...' + key.api_key.slice(-4), // Mask the key
          full_key: key.api_key, // Include full key for copying
          name: key.key_name,
          usage_count: key.usage_count,
          is_active: key.is_active,
          created_at: key.created_at,
          last_used_at: key.last_used
        }))
      })
    } catch (error) {
      console.error('Widget keys GET error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// POST - Create new widget API key
export async function POST(request: NextRequest) {
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const { team_id, name, description, usage_limit } = await request.json()

      // Use user's team_id if not admin or if no team_id provided
      const targetTeamId = user.role === 'admin' && team_id ? team_id : user.team_id
      
      if (!targetTeamId) {
        return NextResponse.json(
          { success: false, error: 'No team specified' },
          { status: 400 }
        )
      }

      // Validate required fields
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'API key name is required' },
          { status: 400 }
        )
      }

      if (usage_limit !== undefined && (usage_limit < 0 || usage_limit > 1000000)) {
        return NextResponse.json(
          { success: false, error: 'Usage limit must be between 0 and 1,000,000' },
          { status: 400 }
        )
      }

      const keyData = {
        team_id: targetTeamId,
        key_name: name.trim(),
        api_key: generateApiKey(),
        is_active: true,
        created_by: user.user_id
      }

      const newKey = await createWidgetKey(keyData)

      // Log the key creation
      await logAuditEvent({
        user_id: user.user_id,
        action: 'create_widget_key',
        entity_type: 'widget_key',
        entity_id: newKey.id,
        details: {
          team_id: targetTeamId,
          key_name: name,
          usage_limit
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Widget API key created successfully',
        key: {
          id: newKey.id,
          api_key: newKey.api_key,
          name: newKey.key_name,
          usage_count: newKey.usage_count,
          is_active: newKey.is_active,
          created_at: newKey.created_at
        }
      })
    } catch (error: unknown) {
      console.error('Widget key creation error:', error)
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 400 }
        )
      }

      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'API key name already exists for this team' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}