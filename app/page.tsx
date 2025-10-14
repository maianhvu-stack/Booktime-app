"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    // Redirect to booking page if user is signed in
    if (isLoaded && isSignedIn) {
      router.push("/booking")
    }
  }, [isLoaded, isSignedIn, router])
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/Anduin-Horizontal-White.png"
                alt="Anduin"
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Text and CTA */}
          <div className="space-y-8">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-left bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 leading-tight">
              Book Time <br /> with Our Team
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 font-medium">
            </p>
            <div className="pt-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Login to Get Started
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/booking">
                    Book a Meeting
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative scale-110">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="/apointment.jpg"
                alt="Team scheduling calendar"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
