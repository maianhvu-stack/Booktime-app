import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Email sending function (you can replace with actual email service)
async function sendConfirmationEmail(booking: any, teamMember: any) {
  const emailContent = `
Hi ${booking.guestName},

Great news! Your meeting has been confirmed.

Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${booking.meetingDate}
⏰ Time: ${booking.meetingTime}
👤 With: ${teamMember.name}, ${teamMember.role}
📧 Email: ${teamMember.email}

Purpose: ${booking.meetingPurpose || 'General discussion'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's Next?
• Add this meeting to your calendar
• Prepare any questions or topics you'd like to discuss
• Join the meeting on time (link will be sent separately if virtual)

Need to reschedule? Just reply to this email and we'll help you out.

Looking forward to connecting with you!

Best regards,
The Anduin Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Anduin | Book Time with Our Team
  `

  console.log('=== CONFIRMATION EMAIL ===')
  console.log('To:', booking.guestEmail)
  console.log('Subject: Meeting Confirmed with', teamMember.name)
  console.log('Content:', emailContent)
  console.log('========================')

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      teamMemberId,
      date,
      time,
      guestName,
      guestEmail,
      timezone,
      duration,
      title,
      description,
    } = body

    if (!teamMemberId || !date || !time || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', teamMemberId)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Save to database first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        team_member_id: teamMemberId,
        guest_name: guestName,
        guest_email: guestEmail,
        meeting_purpose: title || 'Meeting',
        meeting_date: date,
        meeting_time: time,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Call n8n/Flowise to create Google Calendar event
    console.log('📅 Creating calendar event via n8n/Flowise...')

    try {
      // Build a natural language request for Flowise to create the event
      const createEventQuery = `Create a calendar event with the following details:
- Title: ${title || 'Meeting'}
- Description: ${description || ''}
- Date and Time: ${date} ${time}
- Duration: ${duration || 60} minutes
- Timezone: ${timezone || 'Asia/Ho_Chi_Minh'}
- Attendees: ${guestName} (${guestEmail}) and ${teamMember.name} (${teamMember.email})
- Organizer: ${teamMember.name} (${teamMember.email})

Please create this calendar event and send invitations to both attendees.`

      const eventPayload = {
        question: createEventQuery,
        action: 'create_event',
        eventDetails: {
          summary: title || 'Meeting',
          description: description || '',
          startTime: `${date} ${time}`,
          duration: duration || 60,
          timezone: timezone || 'Asia/Ho_Chi_Minh',
          attendees: [
            {
              email: guestEmail,
              name: guestName,
              type: 'external'
            },
            {
              email: teamMember.email,
              name: teamMember.name,
              type: 'internal'
            }
          ],
          organizer: {
            email: teamMember.email,
            name: teamMember.name
          }
        }
      }

      console.log('Event payload:', JSON.stringify(eventPayload, null, 2))

      if (N8N_WEBHOOK_URL) {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventPayload),
        })

        if (n8nResponse.ok) {
          const result = await n8nResponse.json()
          console.log('✅ Calendar event created via Flowise:', result)

          return NextResponse.json({
            success: true,
            booking,
            calendarEvent: result,
            message: 'Booking confirmed and calendar invitations sent to both parties',
          })
        } else {
          console.error('❌ n8n/Flowise webhook error:', n8nResponse.status)
          const errorText = await n8nResponse.text()
          console.error('Error details:', errorText)
        }
      } else {
        console.warn('⚠️ N8N_WEBHOOK_URL not configured')
      }
    } catch (n8nError) {
      console.error('❌ Error calling n8n/Flowise:', n8nError)
    }

    // Fallback: Send confirmation email (legacy)
    await sendConfirmationEmail(
      {
        ...booking,
        meetingDate: date,
        meetingTime: time,
      },
      teamMember
    )

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking confirmed',
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
