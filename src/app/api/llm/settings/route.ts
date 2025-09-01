import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getLLMSettings, saveLLMSettings } from '@/lib/database'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const settings = await getLLMSettings()

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('LLM settings fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Only admin users can update LLM settings
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const settingsData = await request.json()

    const updatedSettings = await saveLLMSettings(settingsData, user.user_id)

    return NextResponse.json({
      success: true,
      data: updatedSettings
    })
  } catch (error) {
    console.error('LLM settings save error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    // Only admin users can update LLM settings
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const settingsData = await request.json()

    const updatedSettings = await saveLLMSettings(settingsData, user.user_id)

    return NextResponse.json({
      success: true,
      data: updatedSettings
    })
  } catch (error) {
    console.error('LLM settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})