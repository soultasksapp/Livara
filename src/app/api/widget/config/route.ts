import { NextRequest, NextResponse } from 'next/server'
import { requireTeamAccess } from '@/lib/auth'
import { getWidgetConfig, createOrUpdateWidgetConfig } from '@/lib/database'
import { logAuditEvent } from '@/lib/database'

// GET - Get widget configuration for team
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

      const config = await getWidgetConfig(targetTeamId)
      
      return NextResponse.json({
        success: true,
        config: config || {
          team_id: targetTeamId,
          widget_title: 'Chat with AI',
          widget_subtitle: 'We are here to help',
          welcome_message: 'Hello! How can I help you today?',
          input_placeholder: 'Type your message...',
          primary_color: '#007bff',
          secondary_color: '#6c757d',
          widget_position: 'bottom-right',
          show_avatar: true,
          show_powered_by: true,
          is_active: true
        }
      })
    } catch (error) {
      console.error('Widget config GET error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// POST/PUT - Create or update widget configuration
export async function POST(request: NextRequest) {
  return requireTeamAccess(async (req: NextRequest, user) => {
    try {
      const {
        team_id,
        widget_title,
        widget_subtitle,
        welcome_message,
        input_placeholder,
        primary_color,
        secondary_color,
        widget_position,
        show_avatar,
        show_powered_by,
        is_active
      } = await request.json()

      // Use user's team_id if not admin or if no team_id provided
      const targetTeamId = user.role === 'admin' && team_id ? team_id : user.team_id
      
      if (!targetTeamId) {
        return NextResponse.json(
          { success: false, error: 'No team specified' },
          { status: 400 }
        )
      }

      // Validate required fields
      if (!widget_title) {
        return NextResponse.json(
          { success: false, error: 'Widget title is required' },
          { status: 400 }
        )
      }

      // Validate widget position
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
      if (widget_position && !validPositions.includes(widget_position)) {
        return NextResponse.json(
          { success: false, error: 'Invalid widget position' },
          { status: 400 }
        )
      }

      // Validate color formats (basic hex validation)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (primary_color && !hexColorRegex.test(primary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid primary color format' },
          { status: 400 }
        )
      }
      if (secondary_color && !hexColorRegex.test(secondary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid secondary color format' },
          { status: 400 }
        )
      }

      const configData = {
        team_id: targetTeamId,
        widget_title: widget_title || 'Chat with AI',
        widget_subtitle: widget_subtitle || 'We are here to help',
        welcome_message: welcome_message || 'Hello! How can I help you today?',
        input_placeholder: input_placeholder || 'Type your message...',
        primary_color: primary_color || '#007bff',
        secondary_color: secondary_color || '#6c757d',
        widget_position: widget_position || 'bottom-right',
        show_avatar: show_avatar !== undefined ? show_avatar : true,
        show_powered_by: show_powered_by !== undefined ? show_powered_by : true,
        is_active: is_active !== undefined ? is_active : true
      }

      const config = await createOrUpdateWidgetConfig(configData)

      // Log the configuration update
      await logAuditEvent({
        user_id: user.user_id,
        action: 'update_widget_config',
        entity_type: 'widget_config',
        entity_id: targetTeamId,
        details: {
          team_id: targetTeamId,
          updated_fields: Object.keys(configData)
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Widget configuration updated successfully',
        config
      })
    } catch (error: any) {
      console.error('Widget config POST error:', error)
      
      if (error.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
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