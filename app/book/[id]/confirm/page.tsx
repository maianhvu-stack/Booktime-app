"use client"

import type React from "react"
import { useState, use } from "react"
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { useEffect } from "react"

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string | null
}

export default function ConfirmBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const date = searchParams.get("date")
  const time = searchParams.get("time")

  const [member, setMember] = useState<TeamMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
  })

  useEffect(() => {
    async function fetchMember() {
      try {
        const response = await fetch(`/api/team-members/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setMember(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching team member:", error)
      }
    }
    fetchMember()
  }, [resolvedParams.id])

  if (!date || !time) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid booking information</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_id: resolvedParams.id,
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone || null,
          meeting_purpose: formData.purpose,
          meeting_date: date,
          meeting_time: time,
        }),
      })

      if (response.ok) {
        setIsConfirmed(true)
      } else {
        const error = await response.json()
        console.error("[v0] Booking error:", error)
        alert("Failed to create booking. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Booking error:", error)
      alert("Failed to create booking. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Generate ICS file content
  function generateICS() {
    const startDateTime = `${date.replace(/-/g, "")}T${time.replace(":", "")}00`
    const endTime = new Date(`${date}T${time}`)
    endTime.setMinutes(endTime.getMinutes() + 30)
    const endDateTime = `${date.replace(/-/g, "")}T${endTime.getHours().toString().padStart(2, "0")}${endTime.getMinutes().toString().padStart(2, "0")}00`

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TeamBook//Meeting//EN
BEGIN:VEVENT
UID:${Date.now()}@teambook.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:Meeting with ${member?.name || "Team Member"}
DESCRIPTION:${formData.purpose}
LOCATION:Video Call
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
  }

  // Show confirmation screen after successful booking
  if (isConfirmed && member) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">Booking Confirmed!</h1>
              <p className="text-muted-foreground mb-8 text-balance max-w-md mx-auto">
                Your meeting has been successfully scheduled. You'll receive a confirmation email at <strong>{formData.email}</strong> with all the details.
              </p>

              <Card className="mb-8 text-left">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{time} (30 minutes)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <a
                    href={`data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS())}`}
                    download="meeting.ics"
                  >
                    Download Calendar Event
                  </a>
                </Button>
                <Button asChild>
                  <Link href="/">Book Another Meeting</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/book/${resolvedParams.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to calendar
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Booking Summary Sidebar */}
          <div className="md:col-span-2">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{time} (30 minutes)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <p className="text-sm text-muted-foreground">Please provide your details to complete the booking</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">
                      Meeting Purpose <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="purpose"
                        name="purpose"
                        placeholder="Please briefly describe what you'd like to discuss..."
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                        className="pl-10 min-h-[100px]"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Confirming Booking..." : "Confirm Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
