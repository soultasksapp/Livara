import { NextRequest, NextResponse } from 'next/server'
import { requireTeamAccess } from '@/lib/auth'
import { getWidgetKeyById, updateWidgetKey, deleteWidgetKey } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - Get specific widget key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const keyId = parseInt(resolvedParams.id)
      if (isNaN(keyId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid key ID' },
          { status: 400 }
        )
      }

      const key = await getWidgetKeyById(keyId)
      if (!key) {
        return NextResponse.json(
          { success: false, error: 'Widget key not found' },
          { status: 404 }
        )
      }

      // Check if user has access to this team's keys
      if (user.role !== 'admin' && key.team_id !== user.team_id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        key: {
          id: key.id,
          api_key: key.api_key,
          name: key.key_name,
          usage_count: key.usage_count,
          is_active: key.is_active,
          created_at: key.created_at,
          last_used_at: key.last_used,
          team_id: key.team_id
        }
      })
    } catch (error) {
      console.error('Widget key GET error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// PUT - Update widget key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const keyId = parseInt(resolvedParams.id)
      if (isNaN(keyId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid key ID' },
          { status: 400 }
        )
      }

      const { name, is_active } = await request.json()

      // Check if key exists and user has access
      const existingKey = await getWidgetKeyById(keyId)
      if (!existingKey) {
        return NextResponse.json(
          { success: false, error: 'Widget key not found' },
          { status: 404 }
        )
      }

      if (user.role !== 'admin' && existingKey.team_id !== user.team_id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Validate inputs
      if (name !== undefined && (!name || name.trim().length === 0)) {
        return NextResponse.json(
          { success: false, error: 'API key name cannot be empty' },
          { status: 400 }
        )
      }

      // Prepare update data
      const updateData: any = {}
      if (name !== undefined) updateData.key_name = name.trim()
      if (is_active !== undefined) updateData.is_active = is_active

      const updatedKey = await updateWidgetKey(keyId, updateData)

      // Log the key update
      await logAuditEvent({
        user_id: user.user_id,
        action: 'update_widget_key',
        entity_type: 'widget_key',
        entity_id: keyId,
        details: {
          team_id: existingKey.team_id,
          key_name: existingKey.key_name,
          changes: Object.keys(updateData)
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Widget API key updated successfully',
        key: {
          id: updatedKey.id,
          api_key: updatedKey.api_key,
          name: updatedKey.key_name,
          usage_count: updatedKey.usage_count,
          is_active: updatedKey.is_active,
          created_at: updatedKey.created_at,
          last_used_at: updatedKey.last_used
        }
      })
    } catch (error: any) {
      console.error('Widget key update error:', error)
      
      if (error.code === '23505') {
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

// DELETE - Delete widget key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const keyId = parseInt(resolvedParams.id)
      if (isNaN(keyId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid key ID' },
          { status: 400 }
        )
      }

      // Check if key exists and user has access
      const existingKey = await getWidgetKeyById(keyId)
      if (!existingKey) {
        return NextResponse.json(
          { success: false, error: 'Widget key not found' },
          { status: 404 }
        )
      }

      if (user.role !== 'admin' && existingKey.team_id !== user.team_id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      await deleteWidgetKey(keyId)

      // Log the key deletion
      await logAuditEvent({
        user_id: user.user_id,
        action: 'delete_widget_key',
        entity_type: 'widget_key',
        entity_id: keyId,
        details: {
          team_id: existingKey.team_id,
          key_name: existingKey.key_name
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Widget API key deleted successfully'
      })
    } catch (error) {
      console.error('Widget key deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}