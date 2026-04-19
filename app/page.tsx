import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src="/images/arousr-logo.jpg"
            alt="Arousr Logo"
            width={128}
            height={128}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Reviews Platform
        </h1>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/queue"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-center transition-colors hover:bg-primary/90"
          >
            Queue
          </Link>
          <Link
            href="/reviews"
            className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium text-center transition-colors hover:bg-secondary/80"
          >
            Reviews
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-lg border border-border text-foreground font-medium text-center transition-colors hover:bg-secondary"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
