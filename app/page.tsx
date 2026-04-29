import { isAuthenticated } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default async function HomePage() {
  const authenticated = await isAuthenticated()
  
  if (authenticated) {
    redirect("/queue")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ad-glJJvyaXrD5KoylEleVYC12hDTkUL8.jpg"
              alt="Arousr Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reviews Platform</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter password to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
