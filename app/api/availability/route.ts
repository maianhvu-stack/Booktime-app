import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://free-n8n.anduin.center/webhook/b64254f1-afec-4205-abf5-6c6a63e803eb/chat'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://free-n8n.anduin.center'


interface TimeSlot {
  date: string
  time: string
  available: boolean
  members: string[]
}

// Helper function to poll n8n execution result
async function pollExecutionResult(executionId: string, participants: any[] = [], maxAttempts = 30, delayMs = 2000): Promise<any> {
  console.log(`🔍 Starting to poll execution ${executionId} (max ${maxAttempts} attempts, ${delayMs}ms delay)`)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const url = `${N8N_BASE_URL}/api/v1/executions/${executionId}`
      console.log(`📡 Attempt ${attempt + 1}/${maxAttempts}: Fetching ${url}`)

      const response = await fetch(url, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
        },
      })

      console.log(`📡 Response status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const execution = await response.json()
        console.log(`📊 Execution status: ${execution.status}`)

        if (execution.status === 'success' && execution.data?.resultData?.runData) {
          // Extract the result from the workflow
          const runData = execution.data.resultData.runData
          console.log(`🔍 All node names: ${Object.keys(runData).join(', ')}`)

          // Try to find the Flowise node (usually "Send request to Flowise")
          let flowiseData = null
          for (const nodeName of Object.keys(runData)) {
            const nodeData = runData[nodeName]?.[0]?.data?.main?.[0]?.[0]?.json
            if (nodeData) {
              console.log(`🔍 Checking node "${nodeName}":`, JSON.stringify(nodeData, null, 2))

              // Check if this node has Flowise response (array format)
              if (Array.isArray(nodeData) && nodeData.length > 0) {
                flowiseData = nodeData[0]
                console.log(`✅ Found Flowise data in "${nodeName}" (array format)`)
                break
              }
              // Or if it's directly the Flowise response
              else if (nodeData.text && nodeData.usedTools) {
                flowiseData = nodeData
                console.log(`✅ Found Flowise data in "${nodeName}" (object format)`)
                break
              }
            }
          }

          if (flowiseData) {
            console.log('🎉 Extracted Flowise data:', JSON.stringify(flowiseData, null, 2))

            // Parse the available slots from Flowise tools output
            const getAvailableSlotsToolOutput = flowiseData.usedTools?.find(
              (tool: any) => tool.tool === 'get_available_slots'
            )?.toolOutput

            if (getAvailableSlotsToolOutput) {
              try {
                const parsedOutput = typeof getAvailableSlotsToolOutput === 'string'
                  ? JSON.parse(getAvailableSlotsToolOutput)
                  : getAvailableSlotsToolOutput

                console.log('📅 Parsed available slots:', JSON.stringify(parsedOutput, null, 2))

                // Transform to our calendar format
                const slots = parsedOutput.availableSlots?.map((slot: any) => ({
                  date: new Date(slot.start).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  time: slot.startDisplay?.replace(' GMT+7', '') || slot.startVN,
                  available: true,
                  members: participants.filter((p: any) => p.type === 'internal').map((p: any) => p.email),
                  startTime: slot.start,
                  endTime: slot.end,
                })) || []

                return {
                  slots,
                  text: flowiseData.text,
                  sessionId: flowiseData.sessionId || flowiseData.chatId,
                  totalSlots: parsedOutput.totalSlots,
                }
              } catch (parseError) {
                console.error('❌ Error parsing available slots:', parseError)
              }
            }

            // Return the raw Flowise data if we can't parse slots
            return flowiseData
          } else {
            console.warn('⚠️ Success but could not find Flowise data')
            console.log('RunData structure:', JSON.stringify(runData, null, 2))
          }
        } else if (execution.status === 'success') {
          console.warn('⚠️ Success but no runData')
          console.log('Full data:', JSON.stringify(execution.data, null, 2))
        } else if (execution.status === 'error') {
          console.error('❌ Execution failed with error')
          console.error('Error details:', JSON.stringify(execution.data?.resultData?.error, null, 2))
          return null
        } else if (execution.status === 'running' || execution.status === 'waiting') {
          console.log(`⏳ Execution still ${execution.status}... waiting`)
        } else {
          console.log(`🤔 Unknown status: ${execution.status}`)
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ API error: ${response.status} - ${errorText}`)
        if (response.status === 401 || response.status === 403) {
          console.error('❌ Authentication failed - check N8N_API_KEY')
          return null
        }
      }
    } catch (error) {
      console.error(`❌ Error polling execution ${executionId}:`, error)
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }

  console.warn(`⚠️ Polling timeout after ${maxAttempts * delayMs / 1000} seconds - execution did not complete in time`)
  return null
}

// Helper to calculate end of current week
function getEndOfWeek() {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
  const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + daysUntilSunday)
  endOfWeek.setHours(23, 59, 59, 999)
  return endOfWeek
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participants, timezone, sessionId } = body

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'Participants array is required' },
        { status: 400 }
      )
    }

    // Calculate date range: today to end of week (MVP)
    const startDate = new Date().toISOString()
    const endDate = getEndOfWeek().toISOString()

    // Build query for n8n/Flowise - only check internal team member's calendar
    const internalMembers = participants.filter((p: any) => p.type === 'internal')
    const internalNames = internalMembers.map((p: any) => p.name).join(", ")
    const query = `Find available meeting times by checking the calendar of: ${internalNames}. Find free slots from today until the end of this week (${new Date().toLocaleDateString()} to ${getEndOfWeek().toLocaleDateString()}). Timezone: ${timezone}.`

    console.log('🔄 Calling n8n webhook...')
    console.log('Query:', query)
    console.log('Participants:', participants)
    console.log('SessionID:', sessionId || 'none (will create new)')

    // Call n8n webhook which will forward to Flowise
    try {
      // Only send internal team members to Flowise (we don't need external guest's calendar)
      const internalParticipants = participants.filter((p: any) => p.type === 'internal')

      const webhookPayload: any = {
        question: query,
        participants: internalParticipants,
        timezone,
        startDate,
        endDate,
      }

      // Include sessionId if provided
      if (sessionId) {
        webhookPayload.sessionId = sessionId
        webhookPayload.overrideConfig = { sessionId }
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ n8n response:', data)

        // Check if data is not null
        if (!data) {
          console.warn('⚠️ n8n returned null response')
          return NextResponse.json({
            slots: generateMockSlots(participants),
            message: 'n8n returned empty response'
          })
        }

        // NEW: Check if n8n returns slots as a JSON string in "Slot" field
        if (data.Slot && typeof data.Slot === 'string') {
          try {
            console.log('🔍 Found Slot field as JSON string, parsing...')
            const parsedSlots = JSON.parse(data.Slot)

            if (Array.isArray(parsedSlots) && parsedSlots.length > 0) {
              console.log('🎉 Found real calendar slots from Flowise (parsed from Slot field)!')

              // Transform to our calendar format
              const transformedSlots = parsedSlots.map((slot: any) => ({
                date: new Date(slot.start).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                time: slot.startDisplay?.replace(' GMT+7', '') || slot.startVN,
                available: true,
                members: participants.filter((p: any) => p.type === 'internal').map((p: any) => p.email),
                startTime: slot.start,
                endTime: slot.end,
              }))

              console.log('📤 Transformed slots being sent to frontend:', JSON.stringify(transformedSlots, null, 2))

              return NextResponse.json({
                slots: transformedSlots,
                sessionId: data.sessionId,
                message: `Found ${transformedSlots.length} available time slots`,
              })
            }
          } catch (parseError) {
            console.error('❌ Error parsing Slot field:', parseError)
          }
        }

        // If n8n returns slots as an array directly (from get_available_slots tool)
        console.log('🔍 Checking if data is slots array:', {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          hasStart: Array.isArray(data) && data.length > 0 ? !!data[0]?.start : 'N/A',
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A'
        })

        if (Array.isArray(data) && data.length > 0 && data[0]?.start) {
          console.log('🎉 Found real calendar slots from Flowise!')

          // Transform to our calendar format
          const transformedSlots = data.map((slot: any) => ({
            date: new Date(slot.start).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            time: slot.startDisplay?.replace(' GMT+7', '') || slot.startVN,
            available: true,
            members: participants.filter((p: any) => p.type === 'internal').map((p: any) => p.email),
            startTime: slot.start,
            endTime: slot.end,
          }))

          console.log('📤 Transformed slots being sent to frontend:', JSON.stringify(transformedSlots, null, 2))

          return NextResponse.json({
            slots: transformedSlots,
            message: `Found ${transformedSlots.length} available time slots`,
          })
        }

        // If n8n returns slots directly in the expected format, use them
        if (data && data.slots && Array.isArray(data.slots)) {
          return NextResponse.json({
            slots: data.slots,
            sessionId: data.sessionId || sessionId
          })
        }

        // If n8n returns executionId, poll for result
        if (data.executionId) {
          console.log(`⏳ Polling for execution result: ${data.executionId}`)
          const result = await pollExecutionResult(data.executionId, participants)

          if (result) {
            // Try to extract slots from result
            const slots = result.slots || result.output?.slots || result.availableSlots
            const returnedSessionId = result.sessionId || data.sessionId || sessionId

            if (slots && Array.isArray(slots)) {
              console.log('✅ Successfully retrieved slots from execution')
              return NextResponse.json({
                slots,
                sessionId: returnedSessionId,
                message: result.text || result.message
              })
            }

            console.log('📝 Raw result from n8n:', JSON.stringify(result, null, 2))
            return NextResponse.json({
              message: result.text || result.output || 'No slots format found',
              sessionId: returnedSessionId,
              slots: generateMockSlots(participants),
              debug: { rawResult: result }
            })
          }
        }

        // If n8n returns a sessionId, keep it for next requests
        if (data.sessionId) {
          console.log('📝 Received sessionId:', data.sessionId)
          return NextResponse.json({
            message: data.text || data.output || 'Processing...',
            sessionId: data.sessionId,
            slots: generateMockSlots(participants),
            debug: { n8nResponse: data }
          })
        }

        console.log('⚠️ n8n did not return slots in expected format, using mock data')
      } else {
        console.error('❌ n8n webhook error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (webhookError) {
      console.error('❌ n8n webhook fetch error:', webhookError)
    }

    // Fallback to mock data for testing
    return NextResponse.json({
      slots: generateMockSlots(participants),
    })
  } catch (error) {
    console.error('❌ Availability error:', error)
    return NextResponse.json({
      slots: generateMockSlots([]),
    })
  }
}

// Generate mock availability slots for testing (today to end of week)
function generateMockSlots(participants: any[]): TimeSlot[] {
  const slots: TimeSlot[] = []
  const today = new Date()
  const endOfWeek = getEndOfWeek()

  // Extract member emails
  const memberEmails = participants
    .filter((p: any) => p.type === 'internal')
    .map((p: any) => p.email)

  // Generate slots from today to end of week
  let currentDate = new Date(today)
  while (currentDate <= endOfWeek) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Generate 30-minute interval slots from 9 AM to 5 PM (excluding lunch 12-1 PM)
      const hours = [
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
      ]

      hours.forEach((time) => {
        const available = Math.random() > 0.4 // 60% chance of being available

        slots.push({
          date: currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time,
          available,
          members: available ? memberEmails : [], // All members available if slot is available
        })
      })
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return slots
}
