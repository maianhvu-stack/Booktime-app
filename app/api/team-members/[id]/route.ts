import { NextResponse } from "next/server"
import { getTeamMemberById } from "@/lib/db/team-members"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getTeamMemberById(id)

  if (!member) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 })
  }

  return NextResponse.json(member)
}
