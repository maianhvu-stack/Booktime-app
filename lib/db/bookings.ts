import { createClient } from "@/lib/supabase/server"

export interface Booking {
  id: string
  team_member_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  meeting_purpose: string
  meeting_date: string
  meeting_time: string
  status: "confirmed" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}

export interface CreateBookingData {
  team_member_id: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  meeting_purpose: string
  meeting_date: string
  meeting_time: string
}

export async function createBooking(
  data: CreateBookingData,
): Promise<{ booking: Booking | null; error: string | null }> {
  const supabase = await createClient()

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      team_member_id: data.team_member_id,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      guest_phone: data.guest_phone || null,
      meeting_purpose: data.meeting_purpose,
      meeting_date: data.meeting_date,
      meeting_time: data.meeting_time,
      status: "confirmed",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating booking:", error)
    return { booking: null, error: error.message }
  }

  return { booking, error: null }
}

export async function getBookingsByTeamMember(teamMemberId: string, date: string): Promise<Booking[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .eq("meeting_date", date)
    .eq("status", "confirmed")

  if (error) {
    console.error("[v0] Error fetching bookings:", error)
    return []
  }

  return data || []
}
