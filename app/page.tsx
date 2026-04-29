import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect("/queue")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ad-glJJvyaXrD5KoylEleVYC12hDTkUL8.jpg"
              alt="Arousr Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reviews Platform</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <Link
          href="/auth/login"
          className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
