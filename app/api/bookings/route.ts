import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// Email sending function via Resend
async function sendConfirmationEmail(booking: any, teamMember: any) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(180deg, #141414 13.96%, #162950 66.5%, #1275DC 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .confirmation {
      background-color: #f0f9ff;
      border-left: 4px solid #1275DC;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .meeting-details {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 25px;
      margin: 25px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 15px;
      align-items: flex-start;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-icon {
      font-size: 20px;
      margin-right: 12px;
      min-width: 24px;
    }
    .detail-content {
      flex: 1;
    }
    .detail-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
    .next-steps {
      margin: 30px 0;
    }
    .next-steps h3 {
      color: #1275DC;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .next-steps ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .next-steps li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .next-steps li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #1275DC;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer-divider {
      border: 0;
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Meeting Confirmed! 🎉</h1>
    </div>

    <div class="content">
      <div class="greeting">
        Hi ${booking.guestName},
      </div>

      <div class="confirmation">
         Your meeting has been confirmed. We're looking forward to connecting with you!
      </div>

      <div class="meeting-details">
        <div class="detail-row">
          <div class="detail-icon">📅</div>
          <div class="detail-content">
            <div class="detail-label">Date</div>
            <div class="detail-value">${booking.meetingDate}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon">⏰</div>
          <div class="detail-content">
            <div class="detail-label">Time</div>
            <div class="detail-value">${booking.meetingTime}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon">👤</div>
          <div class="detail-content">
            <div class="detail-label">Meeting With</div>
            <div class="detail-value">${teamMember.name}${teamMember.role ? `, ${teamMember.role}` : ''}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon">📧</div>
          <div class="detail-content">
            <div class="detail-label">Email</div>
            <div class="detail-value">${teamMember.email}</div>
          </div>
        </div>

        ${booking.meetingPurpose ? `
        <div class="detail-row">
          <div class="detail-icon">📝</div>
          <div class="detail-content">
            <div class="detail-label">Purpose</div>
            <div class="detail-value">${booking.meetingPurpose}</div>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Check your email for a calendar invitation with all the details</li>
          <li>Add this meeting to your calendar</li>
          <li>Prepare any questions or topics you'd like to discuss</li>
          <li>Join the meeting on time</li>
        </ul>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        <strong>Need to reschedule?</strong> Just reply to this email and we'll help you out.
      </p>

      <div class="signature">
        <p style="margin: 0;">Looking forward to connecting with you!</p>
        <p style="margin: 10px 0 0 0;"><strong>Best regards,</strong><br>The Anduin Team</p>
      </div>
    </div>

    <div class="footer">
      <strong>Anduin</strong> | Book Time with Our Team
      <hr class="footer-divider">
      <p style="margin: 10px 0 0 0; font-size: 12px;">
        This is an automated confirmation email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `

  // If Resend is configured, send actual email
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: 'Anduin Team <bookings@anduintransact.com>',
        to: booking.guestEmail,
        subject: `Meeting Confirmed with ${teamMember.name}`,
        html: emailHtml,
      })

      console.log('✅ Email sent successfully via Resend:', result)
      return true
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error)
      return false
    }
  } else {
    // Fallback: Log to console if Resend not configured
    console.log('=== CONFIRMATION EMAIL (Resend not configured) ===')
    console.log('To:', booking.guestEmail)
    console.log('Subject: Meeting Confirmed with', teamMember.name)
    console.log('Note: Set RESEND_API_KEY in .env.local to send actual emails')
    console.log('========================')
    return true
  }
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
