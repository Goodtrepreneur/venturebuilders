import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/logout-button"
import { FounderbaseTable } from "@/components/founderbase-table"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("founder_startups_latest")
    .select(
      "id, company_name, founder_name, email, stage, industry, city, state_region, website, one_liner, current_ask, is_raising, deck_url, third_party_consent, created_at"
    )
    .eq("third_party_consent", true) // explicit gate — admin client bypasses RLS
    .order("created_at", { ascending: false })

  const displayColumns: string[] = []
  const safeRows: { id: string; recordName: string | null; [key: string]: unknown }[] =
    []

  if (rows && rows.length > 0) {
    const allKeys = Object.keys(rows[0] as object)
    displayColumns.push(
      ...allKeys.filter(
        (k) => k !== "email" && k !== "third_party_consent"
      )
    )
    for (const row of rows as Record<string, unknown>[]) {
      const { email: _email, id, ...rest } = row
      const recordName =
        (row.founder_name as string) ??
        (row.company_name as string) ??
        (row.full_name as string) ??
        null
      safeRows.push({
        id: String(id ?? ""),
        recordName,
        ...rest,
      })
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            founderbase
          </h1>
          <LogoutButton variant="outline" size="sm" className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Founderbase</h2>
          <p className="text-sm text-muted-foreground">
            All columns except email are shown. Use “Reveal Email” to view and log access.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load records: {error.message}
          </p>
        ) : (
          <FounderbaseTable columns={displayColumns} rows={safeRows} />
        )}
      </div>
    </main>
  )
}
