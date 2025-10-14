"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { TeamMember } from "@/lib/db/team-members"

interface SearchClientProps {
  teamMembers: TeamMember[]
}

export function SearchClient({ teamMembers }: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMembers = teamMembers.filter((member) => {
    const query = searchQuery.toLowerCase()
    return (
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.expertise.some((exp) => exp.toLowerCase().includes(query))
    )
  })

  return (
    <>
      {/* Search Bar */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, role, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base shadow-lg"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Found {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team members found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
                        <div className="flex flex-wrap gap-2">
                          {member.expertise.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Link href={`/book/${member.id}`}>
                          <Button className="w-full mt-4">View Availability</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
