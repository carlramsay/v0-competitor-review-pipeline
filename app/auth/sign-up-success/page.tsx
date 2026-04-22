import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Check your email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent you a confirmation link. Please check your email to verify your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
