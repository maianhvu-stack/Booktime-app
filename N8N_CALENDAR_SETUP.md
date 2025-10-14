# Calendar Event Creation via Flowise

This document explains how your Flowise flow handles both availability checking AND event creation.

## Overview

Your existing n8n → Flowise integration now handles TWO operations:

1. **Check Availability**: When user searches for available times
2. **Create Event**: When user confirms booking and clicks "Confirm Booking"

## How It Works

### Request Format

The frontend sends requests to the **same n8n webhook** (`N8N_WEBHOOK_URL`), but with different payloads:

#### Availability Check Request:
```json
{
  "question": "Find available meeting times for Mai Anh Vu from today until end of week...",
  "participants": [
    {
      "email": "maianhvu@anduintransact.com",
      "name": "Mai Anh Vu",
      "type": "internal"
    }
  ],
  "timezone": "Asia/Ho_Chi_Minh",
  "startDate": "2025-10-15T00:00:00Z",
  "endDate": "2025-10-19T23:59:59Z"
}
```

#### Event Creation Request:
```json
{
  "question": "Create a calendar event with the following details:\n- Title: Product Demo\n- Description: Discuss features\n- Date and Time: Oct 15, 2025 10:05 AM\n- Duration: 60 minutes\n- Timezone: Asia/Ho_Chi_Minh\n- Attendees: John Doe (john@example.com) and Mai Anh Vu (maianhvu@anduintransact.com)\n- Organizer: Mai Anh Vu (maianhvu@anduintransact.com)\n\nPlease create this calendar event and send invitations to both attendees.",
  "action": "create_event",
  "eventDetails": {
    "summary": "Product Demo",
    "description": "Discuss features",
    "startTime": "Oct 15, 2025 10:05 AM",
    "duration": 60,
    "timezone": "Asia/Ho_Chi_Minh",
    "attendees": [
      {
        "email": "john@example.com",
        "name": "John Doe",
        "type": "external"
      },
      {
        "email": "maianhvu@anduintransact.com",
        "name": "Mai Anh Vu",
        "type": "internal"
      }
    ],
    "organizer": {
      "email": "maianhvu@anduintransact.com",
      "name": "Mai Anh Vu"
    }
  }
}
```

## Flowise Configuration

### Your Flowise flow should handle both operations:

1. **Detect the operation type**:
   - If `action: "create_event"` → Create calendar event
   - Otherwise → Check availability

2. **For Availability Check**:
   - Use the `get_available_slots` tool to query Google Calendar
   - Return available time slots

3. **For Event Creation**:
   - Use a `create_calendar_event` tool (or similar) to:
     - Create the event in Google Calendar
     - Add both attendees
     - Set `sendUpdates: "all"` to send email invitations
   - Return success confirmation

## Setting Up Event Creation Tool in Flowise

You'll need to add a tool in your Flowise flow that can create calendar events. Here are the options:

### Option 1: Custom Tool (Recommended)

Create a custom tool in Flowise that:
1. Receives event details from the structured data
2. Calls Google Calendar API to create the event
3. Ensures `sendUpdates: "all"` is set to send invitations

### Option 2: Google Calendar API Node

If Flowise has a Google Calendar integration:
1. Add Google Calendar node
2. Configure with your Google account
3. Set operation to "Create Event"
4. Map the event details from `eventDetails` object

### Required Event Configuration

```javascript
{
  "summary": eventDetails.summary,
  "description": eventDetails.description,
  "start": {
    "dateTime": convertToISO(eventDetails.startTime),
    "timeZone": eventDetails.timezone
  },
  "end": {
    "dateTime": calculateEndTime(eventDetails.startTime, eventDetails.duration),
    "timeZone": eventDetails.timezone
  },
  "attendees": eventDetails.attendees.map(a => ({
    "email": a.email,
    "displayName": a.name
  })),
  "organizer": {
    "email": eventDetails.organizer.email,
    "displayName": eventDetails.organizer.name
  },
  "sendUpdates": "all"  // This sends email invitations!
}
```

## Testing the Integration

### Test Availability Check:
1. Go to http://localhost:3000/booking
2. Select a team member
3. Click "Search"
4. Should see real available time slots from Google Calendar

### Test Event Creation:
1. Select an available time slot
2. Fill in meeting details (title, description, duration)
3. Click "Confirm Meeting"
4. Enter your name and email
5. Click "Confirm Booking"
6. Check:
   - ✅ Event appears in team member's Google Calendar
   - ✅ Guest receives email invitation
   - ✅ Team member receives email invitation
   - ✅ Both can accept/decline

## Debugging

### Check the logs:
1. **Frontend console**: Look for event payload being sent
2. **Server logs**: Check `/api/bookings` logs
3. **n8n logs**: Check webhook execution
4. **Flowise logs**: Check if event creation tool is called

### Common issues:

**No invitations sent?**
- Ensure `sendUpdates: "all"` is set in the calendar event creation
- Check that attendee emails are valid
- Verify Google Calendar API permissions

**Event not created?**
- Check Flowise flow has a tool for creating events
- Verify the tool has proper Google Calendar API access
- Check date/time format is correct

**Wrong timezone?**
- Ensure timezone format matches IANA standard (e.g., "Asia/Ho_Chi_Minh")
- Check that both start and end times use the same timezone

## Next Steps

1. **Update your Flowise flow** to handle the `action: "create_event"` payload
2. **Add event creation tool** to Flowise (if not already present)
3. **Test the complete flow** end-to-end
4. **Verify both parties receive email invitations**

---

**Note**: Since everything goes through your existing n8n → Flowise integration, you don't need to create a separate workflow. Just update your Flowise flow to handle event creation requests in addition to availability checks.
