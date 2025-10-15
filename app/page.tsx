import Link from "next/link"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function HomePage() {
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
            {/* Empty space for cleaner homepage */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Text and CTA */}
          <div className="space-y-8">
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-left bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 leading-tight">
                Book Time
              </h1>
              <p className="text-3xl md:text-4xl font-medium text-white mt-4">
                with Anduin team
              </p>
            </div>
            <div className="pt-4">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/booking">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white shadow-lg shadow-[#1275DC]/50">
                    Book a Meeting
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-[#4A9FEE] to-[#1275DC] hover:from-[#3A8FDE] hover:to-[#0d5eb8] text-white shadow-lg shadow-[#1275DC]/50" asChild>
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
                src="/scheduler-booking.png"
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
