"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Calendar } from "lucide-react"

interface TimeSlot {
  date: string
  time: string
  available: boolean
  members: string[]
  startTime?: string
  endTime?: string
}

interface SimpleAvailabilityProps {
  slots: TimeSlot[]
  onSelectSlot: (date: string, time: string) => void
}

export function SimpleAvailability({ slots, onSelectSlot }: SimpleAvailabilityProps) {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (slot.available) {
      if (!acc[slot.date]) {
        acc[slot.date] = { morning: [], afternoon: [] }
      }

      // Parse time to determine morning/afternoon
      const timeStr = slot.time
      const isPM = timeStr.includes('PM')
      const hour = parseInt(timeStr.split(':')[0])

      // Morning: before 12pm, Afternoon: 12pm and after
      if (!isPM || hour === 12) {
        if (hour < 12 || (hour === 12 && !isPM)) {
          acc[slot.date].morning.push(slot)
        } else {
          acc[slot.date].afternoon.push(slot)
        }
      } else {
        acc[slot.date].afternoon.push(slot)
      }
    }
    return acc
  }, {} as Record<string, { morning: TimeSlot[], afternoon: TimeSlot[] }>)

  const dates = Object.keys(slotsByDate).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No available time slots found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try selecting a different team member or time range.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const { morning, afternoon } = slotsByDate[date]
        const dateObj = new Date(date)
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

        return (
          <Card key={date}>
            <CardContent className="p-6">
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">{dayName}</h3>
                  <p className="text-sm text-muted-foreground">{date}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Morning Slots */}
                {morning.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm text-muted-foreground">Morning</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {morning.map((slot, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => onSelectSlot(slot.date, slot.time)}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{slot.time.replace(' GMT+7', '')}</div>
                            {slot.startTime && slot.endTime && (
                              <div className="text-xs text-muted-foreground mt-1">
                                1 hour
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoon.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm text-muted-foreground">Afternoon</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {afternoon.map((slot, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => onSelectSlot(slot.date, slot.time)}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{slot.time.replace(' GMT+7', '')}</div>
                            {slot.startTime && slot.endTime && (
                              <div className="text-xs text-muted-foreground mt-1">
                                1 hour
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
