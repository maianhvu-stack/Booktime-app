import { createClient } from "@/lib/supabase/server"

export interface TeamMember {
  id: string
  name: string
  role: string
  expertise: string[]
  avatar: string | null
  bio: string | null
  email: string
  created_at: string
  updated_at: string
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("team_members").select("*").order("name")

  if (error) {
    console.error("[v0] Error fetching team members:", error)
    return []
  }

  return data || []
}

export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single()

  if (error) {
    console.error("[v0] Error fetching team member:", error)
    return null
  }

  return data
}
