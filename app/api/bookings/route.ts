import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
      guestPhone,
      meetingPurpose,
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

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        team_member_id: teamMemberId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        meeting_purpose: meetingPurpose || 'General discussion',
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
      message: 'Booking confirmed and confirmation email sent',
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
