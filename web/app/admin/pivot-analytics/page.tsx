import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ADMIN_EMAIL = "steve@veturebuilders.fund"

type RawSignal = Record<string, unknown>

function getStr(r: RawSignal, ...keys: string[]) {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === "string" && v) return v
  }
  return ""
}

function getNum(r: RawSignal, ...keys: string[]) {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === "number" && !Number.isNaN(v)) return v
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v)))
      return Number(v)
  }
  return 0
}

function inThisMonth(r: RawSignal, now: Date) {
  const raw =
    r.signal_month ??
    r.month ??
    r.created_at ??
    r.watched_at ??
    r.last_signal_at
  if (raw == null) return true
  const d = new Date(String(raw))
  if (Number.isNaN(+d)) return true
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isFundraisingTopic(topic: string) {
  const t = topic.toLowerCase()
  return (
    t.includes("fund") ||
    t.includes("raise") ||
    t.includes("capital") ||
    t.includes("investor") ||
    t.includes("pitch")
  )
}

export default async function PivotAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard")
  }

  const { data: signals, error: signalsError } = await supabase
    .from("v_founder_topic_signals")
    .select("*")

  const rows = (signals ?? []) as RawSignal[]
  const now = new Date()
  const monthRows = rows.filter((r) => inThisMonth(r, now))
  const fundraisingRows = monthRows.filter((r) =>
    isFundraisingTopic(getStr(r, "topic", "Topic"))
  )
  const fundraisingEmails = new Set(
    fundraisingRows
      .map((r) => getStr(r, "viewer_email", "email", "viewerEmail"))
      .filter(Boolean)
  )
  const monthEmails = new Set(
    monthRows
      .map((r) => getStr(r, "viewer_email", "email", "viewerEmail"))
      .filter(Boolean)
  )
  const fundraisingSignalsCount =
    fundraisingEmails.size > 0 ? fundraisingEmails.size : monthEmails.size

  const topicMap = new Map<string, { total: number; founders: Set<string> }>()
  for (const r of rows) {
    const topic = getStr(r, "topic", "Topic")
    if (!topic) continue
    const email = getStr(r, "viewer_email", "email", "viewerEmail")
    const w = getNum(r, "watch_count", "watchCount", "total_watches") || 1
    const cur = topicMap.get(topic) ?? { total: 0, founders: new Set<string>() }
    cur.total += w
    if (email) cur.founders.add(email)
    topicMap.set(topic, cur)
  }
  const topicRanked = [...topicMap.entries()]
    .map(([topic, v]) => ({
      topic,
      total_signals: v.total,
      founder_count: v.founders.size,
    }))
    .sort((a, b) => b.total_signals - a.total_signals)

  const byEmail = new Map<
    string,
    { topics: Map<string, number>; name: string; founderId: string | null }
  >()
  for (const r of rows) {
    const email = getStr(r, "viewer_email", "email", "viewerEmail")
    if (!email) continue
    const topic = getStr(r, "topic", "Topic") || "—"
    const w = getNum(r, "watch_count", "watchCount") || 1
    const name =
      getStr(r, "first_name", "founder_name", "name", "full_name") || "—"
    const founderId = getStr(r, "founder_id", "founderId") || null
    const cur =
      byEmail.get(email) ?? { topics: new Map(), name, founderId }
    if (name && name !== "—") cur.name = name
    if (founderId) cur.founderId = founderId
    cur.topics.set(topic, (cur.topics.get(topic) ?? 0) + w)
    byEmail.set(email, cur)
  }

  const founderRows = [...byEmail.entries()].map(([email, v]) => {
    const topTopics = [...v.topics.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t)
    const totalWatches = [...v.topics.values()].reduce((a, b) => a + b, 0)
    return {
      email,
      name: v.name,
      topTopics,
      totalWatches,
      founderId: v.founderId,
    }
  })
  founderRows.sort((a, b) => b.totalWatches - a.totalWatches)

  const distinctFounders = new Set(
    rows.map((r) => getStr(r, "viewer_email", "email", "viewerEmail")).filter(Boolean)
  ).size
  const totalWatchSignals = rows.reduce(
    (acc, r) => acc + (getNum(r, "watch_count", "watchCount") || 1),
    0
  )

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Pivot analytics
          </h1>
          <LogoutButton variant="outline" size="sm" className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Library engagement and founder topic signals.
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Founders with signals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {distinctFounders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total watch signals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {totalWatchSignals}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Topics tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {topicMap.size}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-10">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            Sponsor performance
          </h3>
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Sponsor KPIs can be wired to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                pivot_sponsor_impressions
              </code>{" "}
              when you are ready.
            </CardContent>
          </Card>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold text-foreground">
            Founder signals
          </h3>

          {signalsError ? (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Could not load{" "}
              <code className="font-mono text-xs">v_founder_topic_signals</code>
              : {signalsError.message}
            </p>
          ) : null}

          <div
            className="mb-6 rounded-xl border border-white/10 bg-[#1a0800] p-5 shadow-sm border-l-4 border-l-[#FF6B2B]"
            role="status"
            aria-live="polite"
          >
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[#FF6B2B]">
              {fundraisingSignalsCount}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-white">
              founders showing fundraising signals this month
            </p>
          </div>

          <div className="mb-8 overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <h4 className="text-sm font-medium text-foreground">
                Topics by interest
              </h4>
              <p className="text-xs text-muted-foreground">
                Ranked by total signals and distinct founders.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Topic
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">
                      Total signals
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">
                      Founders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topicRanked.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No topic rows yet.
                      </td>
                    </tr>
                  ) : (
                    topicRanked.map((row) => (
                      <tr
                        key={row.topic}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {row.topic}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {row.total_signals}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {row.founder_count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <h4 className="text-sm font-medium text-foreground">
                Per-founder signals
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Top topics
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">
                      Total watches
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {founderRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No founder rows yet.
                      </td>
                    </tr>
                  ) : (
                    founderRows.map((row) => (
                      <tr
                        key={row.email}
                        className="border-b border-border last:border-0"
                      >
                        <td className="max-w-[200px] truncate px-4 py-3 text-foreground">
                          {row.email}
                        </td>
                        <td className="px-4 py-3 text-foreground">{row.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.topTopics.map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="font-normal"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {row.totalWatches}
                        </td>
                        <td className="px-4 py-3">
                          {row.founderId ? (
                            <Link
                              href="/dashboard"
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              View profile
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
