"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamMember {
  id: string
  name: string
  email: string
  color: string
}

interface TimeSlot {
  date: string
  time: string
  available: boolean
  members: string[] // member emails available at this slot
}

interface WeekCalendarProps {
  slots: TimeSlot[]
  selectedMembers: TeamMember[]
  onSelectSlot: (date: string, time: string) => void
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
// Generate 30-minute intervals for more flexible booking
const HOURS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", // Lunch time
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
]

const MEMBER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
]

export function WeekCalendar({ slots, selectedMembers, onSelectSlot }: WeekCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [customTime, setCustomTime] = useState("")
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Get current week dates
  const getWeekDates = (offset: number) => {
    const dates = []
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + offset * 7) // Monday

    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeekOffset)

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time })
    setCustomTime(time)
    setShowTimePicker(true)
  }

  const handleConfirmTime = () => {
    if (selectedSlot) {
      onSelectSlot(selectedSlot.date, customTime)
      setShowTimePicker(false)
    }
  }

  const isSlotAvailable = (date: Date, hour: string): boolean => {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // Check if this is lunch time (12pm-1pm)
    if (hour === "12:00 PM" || hour === "12:30 PM") {
      return false
    }

    const slot = slots.find(s => s.date === dateStr && s.time === hour)
    if (!slot) return false

    // For multiple members, only show if ALL are available
    const allMembersAvailable = selectedMembers.every(member =>
      slot.members.includes(member.email)
    )

    return slot.available && allMembersAvailable
  }


  return (
    <div className="space-y-4">
      {/* Member Legend */}
      {selectedMembers.length > 1 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Selected Team Members:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member, idx) => (
              <div key={member.id} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", MEMBER_COLORS[idx % MEMBER_COLORS.length])} />
                <span className="text-sm">{member.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>
        <div className="text-sm font-medium">
          {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[4].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
        >
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-6 border-b">
            <div className="p-2 font-semibold text-sm bg-muted/50"></div>
            {weekDates.map((date, idx) => (
              <div key={idx} className="p-2 text-center font-semibold text-sm bg-muted/50">
                <div>{DAYS[idx]}</div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-6 border-b hover:bg-accent/5">
              {/* Time Label */}
              <div className="p-2 text-xs font-medium border-r">
                {hour}
              </div>

              {/* Day Slots */}
              {weekDates.map((date, idx) => {
                const available = isSlotAvailable(date, hour)
                const isLunchTime = hour === "12:00 PM" || hour === "12:30 PM"

                return (
                  <button
                    key={idx}
                    disabled={!available || isLunchTime}
                    onClick={() => handleSlotClick(
                      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      hour
                    )}
                    className={cn(
                      "p-2 border-r min-h-[60px] transition-colors",
                      available && "hover:bg-primary/10 cursor-pointer",
                      !available && !isLunchTime && "bg-muted/50 cursor-not-allowed",
                      isLunchTime && "bg-muted/30 cursor-not-allowed",
                      available && selectedMembers.length === 1 && "bg-green-50 hover:bg-green-100",
                      available && selectedMembers.length > 1 && "bg-gradient-to-br from-blue-50 to-green-50"
                    )}
                  >
                    {isLunchTime && (
                      <span className="text-xs text-muted-foreground">Lunch</span>
                    )}
                    {available && !isLunchTime && (
                      <div className="flex items-center justify-center">
                        <Clock className="w-3 h-3 text-green-600" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Time Picker Dialog */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Meeting Time</DialogTitle>
            <DialogDescription>
              Default is a 1-hour block. Adjust the time if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Meeting Date</Label>
              <Input value={selectedSlot?.date || ""} disabled />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={customTime.replace(" AM", "").replace(" PM", "")}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g., 15:30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can select any time, not just hourly blocks (e.g., 3:15 PM, 3:30 PM)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTimePicker(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmTime} className="flex-1">
              Confirm Time
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-muted/50 border" />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-muted/30 border" />
          <span>Lunch Break (12-1pm)</span>
        </div>
      </div>
    </div>
  )
}
