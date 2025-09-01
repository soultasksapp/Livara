import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getContactsByTeam, saveContact, getAllContacts } from '@/lib/database'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    let contacts

    if (user.role === 'admin' || user.role === 'super_admin') {
      // Admin can see all contacts
      contacts = await getAllContacts()
    } else if (user.team_id) {
      // Regular users see only their team's contacts
      contacts = await getContactsByTeam(user.team_id)
    } else {
      // For users without teams, return empty contacts
      contacts = []
    }

    return NextResponse.json({
      success: true,
      data: contacts
    })
  } catch (error) {
    console.error('Contacts fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const contactData = await request.json()

    const newContact = await saveContact({
      ...contactData,
      team_id: user.team_id || undefined
    })

    return NextResponse.json({
      success: true,
      data: newContact
    })
  } catch (error) {
    console.error('Contact save error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})