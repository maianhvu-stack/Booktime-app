"use client"

import { useState } from "react"
import Link from "next/link"
import { Stepper } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { SimpleAvailability } from "@/components/simple-availability"
import { SearchIcon, CheckCircle2, User, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const BOOKING_STEPS = [
  { title: "Your Info & Find Team"},
  { title: "Find Available Slots"},
  { title: "Complete your booking"},
]

const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (GMT+7)" },
  { value: "America/Los_Angeles", label: "US Pacific (GMT-8)" },
  { value: "America/New_York", label: "US Eastern (GMT-5)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
]

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  expertise: string[]
  color: string
}

interface TimeSlot {
  date: string
  time: string
  available: boolean
  members: string[]
}

export default function BookingPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1)

  // User info
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userTimezone, setUserTimezone] = useState("Asia/Ho_Chi_Minh")

  // Team search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Availability
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")

  // Meeting details dialog
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [tempSlot, setTempSlot] = useState<{ date: string; time: string } | null>(null)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDescription, setMeetingDescription] = useState("")
  const [meetingDuration, setMeetingDuration] = useState("60") // 30 or 60 minutes

  // Booking
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Stage 1: Search team members (Supabase)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/team-members/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.members || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member)
  }

  const handleProceedToCalendar = async () => {
    if (!userName.trim() || !userEmail.trim() || !selectedMember) {
      alert("Please fill in your info and select a team member")
      return
    }

    setCurrentStep(2)
    setIsLoadingSlots(true)

    try {
      // Generate sessionId if not exists (for Flowise conversation continuity)
      const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      if (!sessionId) {
        setSessionId(currentSessionId)
      }

      // Send participants to Flowise via n8n
      const participants = [
        { name: userName, email: userEmail, type: "external" },
        { name: selectedMember.name, email: selectedMember.email, type: "internal" }
      ]

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
          timezone: userTimezone,
          sessionId: currentSessionId,
        }),
      })

      const data = await response.json()

      // Update sessionId if returned from server
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }

      setAvailableSlots(data.slots || [])

      // Log debug info if available
      if (data.debug) {
        console.log("Debug info:", data.debug)
      }
      if (data.message) {
        console.log("Message from n8n:", data.message)
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleSelectSlot = (date: string, time: string) => {
    setTempSlot({ date, time })
    setShowMeetingDialog(true)
  }

  const handleConfirmMeetingDetails = () => {
    if (!tempSlot) return
    setSelectedSlot(tempSlot)
    setShowMeetingDialog(false)
    setCurrentStep(3)
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedMember) return

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMemberId: selectedMember.id,
          date: selectedSlot.date,
          time: selectedSlot.time,
          guestName: userName,
          guestEmail: userEmail,
          timezone: userTimezone,
          duration: parseInt(meetingDuration),
          title: meetingTitle || "Meeting",
          description: meetingDescription || "",
        }),
      })

      if (response.ok) {
        setBookingSuccess(true)
      }
    } catch (error) {
      console.error("Booking error:", error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/Anduin-Horizontal-White.png"
              alt="Anduin"
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Book a Meeting
            </h1>
            <p className="text-xl text-white/80">
              Find our team and schedule your meeting
            </p>
          </div>

          {/* Stage Content */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-8">
              {/* Stepper - Centered in card */}
              <div className="mb-16 flex justify-center">
                <div className="w-full max-w-2xl">
                  <Stepper steps={BOOKING_STEPS} currentStep={currentStep} />
                </div>
              </div>
              {/* Stage 1: User Info + Team Search */}
              {currentStep === 1 && (
                <div className="space-y-10">
                  {/* User Info Section */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <User className="w-6 h-6" />
                      Your Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">Your Name *</Label>
                        <Input
                          id="name"
                          placeholder=""
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base">Your Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder=""
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>
                      {sessionId && (
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="sessionId">Session ID (for n8n/Flowise)</Label>
                          <Input
                            id="sessionId"
                            value={sessionId}
                            readOnly
                            className="bg-muted/50 font-mono text-xs"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This session ID is used to maintain conversation context with the AI
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-8" />

                  {/* Team Search Section */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2 mb-3">
                        <SearchIcon className="w-6 h-6" />
                        Find Our Team
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Search for our team member
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Input
                        type="text"
                        placeholder=""
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1 h-12 text-base"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="h-12 px-8 text-base bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white shadow-lg shadow-[#1275DC]/50"
                      >
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>

                    {/* Selected Member */}
                    {selectedMember && (
                      <div className="bg-accent/20 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Selected:</h3>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 px-3 py-1 rounded-full text-sm">
                            {selectedMember.name} - {selectedMember.role}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Search Results</h3>
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                          {searchResults.map((member) => {
                            const isSelected = selectedMember?.id === member.id
                            return (
                              <Card
                                key={member.id}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                                }`}
                                onClick={() => handleSelectMember(member)}
                              >
                                <CardContent className="p-4">
                                  <h4 className="font-semibold">{member.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {member.role} • {member.expertise.join(", ")}
                                  </p>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleProceedToCalendar}
                    disabled={!userName || !userEmail || !selectedMember}
                    className="w-full mt-8 h-12 text-base bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white shadow-lg shadow-[#1275DC]/50"
                    size="lg"
                  >
                    View Availability
                  </Button>
                </div>
              )}

              {/* Stage 2: Calendar View */}
              {currentStep === 2 && selectedMember && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Select Available Time</h2>
                    <p className="text-muted-foreground">
                    {selectedMember.name}'s calendar 
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Times shown in {TIMEZONES.find(tz => tz.value === userTimezone)?.label}
                    </p>
                  </div>

                  {isLoadingSlots ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading available slots...</p>
                    </div>
                  ) : (
                    <SimpleAvailability
                      slots={availableSlots}
                      onSelectSlot={handleSelectSlot}
                    />
                  )}

                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back to Search
                  </Button>
                </div>
              )}

              {/* Stage 3: Confirmation */}
              {currentStep === 3 && !bookingSuccess && selectedSlot && selectedMember && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      Confirm Your Booking
                    </h2>
                    <p className="text-muted-foreground">
                      Review your booking details below
                    </p>
                  </div>

                  <Card className="bg-accent/20">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Info</p>
                        <p className="text-lg font-semibold">{userName}</p>
                        <p className="text-sm">{userEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Meeting with</p>
                        <p className="text-lg font-semibold">{selectedMember.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="text-lg font-semibold">
                          {selectedSlot.date} at {selectedSlot.time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {TIMEZONES.find(tz => tz.value === userTimezone)?.label} • {meetingDuration} minutes
                        </p>
                      </div>
                      {meetingTitle && (
                        <div>
                          <p className="text-sm text-muted-foreground">Meeting Title</p>
                          <p className="text-lg font-semibold">{meetingTitle}</p>
                        </div>
                      )}
                      {meetingDescription && (
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm">{meetingDescription}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmBooking}
                      className="flex-1 bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white"
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {bookingSuccess && selectedMember && (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-bold">Booking Confirmed!</h3>
                  <p className="text-muted-foreground">
                    We've successfully booked your meeting with {selectedMember.name} on{" "}
                    {selectedSlot?.date} at {selectedSlot?.time}.
                  </p>
                  <p className="text-muted-foreground">
                    A confirmation email has been sent to {userEmail}.
                  </p>
                  <Button asChild className="mt-4 bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Meeting Details Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Meeting Details
            </DialogTitle>
            <DialogDescription>
              Customize your meeting with {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selected Time Display */}
            <div className="bg-accent/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Selected Time</p>
              <p className="font-semibold text-lg">
                {tempSlot?.date} at {tempSlot?.time}
              </p>
            </div>

            {/* Meeting Duration */}
            <div className="space-y-3">
              <Label htmlFor="duration" className="text-base">Meeting Duration *</Label>
              <RadioGroup value={meetingDuration} onValueChange={setMeetingDuration}>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="30" id="duration-30" />
                  <Label htmlFor="duration-30" className="flex-1 cursor-pointer">
                    <span className="font-semibold">30 minutes</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="60" id="duration-60" />
                  <Label htmlFor="duration-60" className="flex-1 cursor-pointer">
                    <span className="font-semibold">1 hour</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Meeting Title */}
            <div className="space-y-2">
              <Label htmlFor="meeting-title" className="text-base">Meeting Title</Label>
              <Input
                id="meeting-title"
                placeholder=""
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Meeting Description */}
            <div className="space-y-2">
              <Label htmlFor="meeting-description" className="text-base">
                Description <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="meeting-description"
                placeholder="Tell us what you'd like to discuss..."
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMeetingDetails}
              className="bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white"
            >
              Continue to Confirmation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
