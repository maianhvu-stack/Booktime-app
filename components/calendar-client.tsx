"use client"

import { useState } from "react"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns"

// Generate mock available time slots for the next 2 weeks
function generateTimeSlots() {
  const slots: { date: string; time: string; available: boolean }[] = []
  const today = new Date()
  const times = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]

  for (let day = 0; day < 14; day++) {
    const date = addDays(today, day)
    const dateStr = format(date, "yyyy-MM-dd")

    if (date.getDay() === 0 || date.getDay() === 6) continue

    times.forEach((time) => {
      slots.push({
        date: dateStr,
        time,
        available: Math.random() > 0.3,
      })
    })
  }

  return slots
}

interface CalendarClientProps {
  memberId: string
}

export function CalendarClient({ memberId }: CalendarClientProps) {
  const router = useRouter()
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const timeSlots = generateTimeSlots()
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  const times = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]

  const handleSlotSelect = (date: string, time: string) => {
    setSelectedSlot({ date, time })
  }

  const handleContinue = () => {
    if (selectedSlot) {
      router.push(`/book/${memberId}/confirm?date=${selectedSlot.date}&time=${selectedSlot.time}`)
    }
  }

  const getSlotStatus = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const slot = timeSlots.find((s) => s.date === dateStr && s.time === time)
    return slot?.available ?? false
  }

  const isSlotSelected = (date: Date, time: string) => {
    if (!selectedSlot) return false
    const dateStr = format(date, "yyyy-MM-dd")
    return selectedSlot.date === dateStr && selectedSlot.time === time
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select a Time Slot
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose an available time for your 30-minute meeting</p>
      </CardHeader>
      <CardContent className="p-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
            disabled={currentWeekStart <= new Date()}
          >
            Previous Week
          </Button>
          <span className="text-sm font-medium">
            {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
            disabled={addDays(currentWeekStart, 7) > addDays(new Date(), 14)}
          >
            Next Week
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-sm font-medium text-muted-foreground">Time</div>
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="text-center">
                  <div className="text-sm font-medium">{format(date, "EEE")}</div>
                  <div className="text-xs text-muted-foreground">{format(date, "MMM d")}</div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              {times.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </div>
                  {weekDates.map((date) => {
                    const isAvailable = getSlotStatus(date, time)
                    const isSelected = isSlotSelected(date, time)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const isPast = date < new Date() && !isSameDay(date, new Date())

                    return (
                      <button
                        key={`${date.toISOString()}-${time}`}
                        onClick={() => isAvailable && !isPast && handleSlotSelect(format(date, "yyyy-MM-dd"), time)}
                        disabled={!isAvailable || isWeekend || isPast}
                        className={`
                          h-12 rounded-md text-xs font-medium transition-all
                          ${isWeekend || isPast ? "bg-muted/30 cursor-not-allowed" : ""}
                          ${!isAvailable && !isWeekend && !isPast ? "bg-muted/50 cursor-not-allowed text-muted-foreground" : ""}
                          ${isAvailable && !isWeekend && !isPast ? "bg-primary/10 hover:bg-primary/20 cursor-pointer" : ""}
                          ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
                        `}
                      >
                        {isWeekend
                          ? "-"
                          : !isAvailable && !isPast
                            ? "Booked"
                            : isAvailable && !isPast
                              ? "Available"
                              : "-"}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Selected Time</p>
                <p className="text-lg font-semibold">
                  {format(parseISO(selectedSlot.date), "EEEE, MMMM d, yyyy")} at {selectedSlot.time}
                </p>
              </div>
              <Button onClick={handleContinue} size="lg">
                Continue to Booking
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
