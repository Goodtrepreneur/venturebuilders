import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { AdminPanel } from "@/components/admin-panel"

const ADMIN_EMAIL = "steve@venturebuilders.fund"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard")
  }

  const [
    { data: pendingInvestors, error: pendingError },
    { data: revealActivity, error: revealsError },
  ] = await Promise.all([
    supabase
      .from("pending_investors")
      .select("id, full_name, email, firm, message, status, submitted_at, invited_at")
      .order("submitted_at", { ascending: false }),
    supabase
      .from("email_reveals")
      .select("id, user_email, record_name, revealed_at")
      .order("revealed_at", { ascending: false }),
  ])

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Venture Builders
          </h1>
          <LogoutButton variant="outline" size="sm" className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Admin</h2>
          <p className="text-sm text-muted-foreground">
            Manage pending investors and view email reveal activity.
          </p>
        </div>

        {pendingError && (
          <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load pending investors: {pendingError.message}
          </p>
        )}
        {revealsError && (
          <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load reveal activity: {revealsError.message}
          </p>
        )}

        <AdminPanel
          pendingInvestors={pendingInvestors ?? []}
          revealActivity={revealActivity ?? []}
        />
      </div>
    </main>
  )
}
