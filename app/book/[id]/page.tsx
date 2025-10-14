import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getTeamMemberById } from "@/lib/db/team-members"
import { CalendarClient } from "@/components/calendar-client"
import { redirect } from "next/navigation"

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const member = await getTeamMemberById(resolvedParams.id)

  if (!member) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Team Member Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{member.name}</h1>
                <p className="text-muted-foreground mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground mb-3">{member.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CalendarClient memberId={resolvedParams.id} />
      </div>
    </div>
  )
}
