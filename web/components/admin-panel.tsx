"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { inviteInvestor, rejectInvestor } from "@/app/admin/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PendingInvestor = {
  id: string
  full_name: string
  email: string
  firm: string | null
  message: string | null
  status: string
  submitted_at: string
  invited_at: string | null
}

type RevealRow = {
  id: string
  user_email: string | null
  record_name: string | null
  revealed_at: string
}

interface AdminPanelProps {
  pendingInvestors: PendingInvestor[]
  revealActivity: RevealRow[]
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "invited"
      ? "invited"
      : status === "rejected"
        ? "rejected"
        : "pending"
  return <Badge variant={variant}>{status}</Badge>
}

export function AdminPanel({
  pendingInvestors,
  revealActivity,
}: AdminPanelProps) {
  const router = useRouter()
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  async function handleInvite(id: string, email: string) {
    setInvitingId(id)
    const result = await inviteInvestor(id, email)
    setInvitingId(null)
    if (result.error) {
      toast.error("Invite failed", { description: result.error })
    } else {
      toast.success("Invite sent", { description: `Invitation sent to ${email}` })
      router.refresh()
    }
  }

  async function handleReject(id: string) {
    setRejectingId(id)
    const result = await rejectInvestor(id)
    setRejectingId(null)
    if (result.error) {
      toast.error("Reject failed", { description: result.error })
    } else {
      router.refresh()
    }
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-4 flex w-full flex-wrap gap-1 sm:flex-nowrap">
        <TabsTrigger value="pending" className="flex-1 sm:flex-none">Pending Investors</TabsTrigger>
        <TabsTrigger value="reveals" className="flex-1 sm:flex-none">Reveal Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-0">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Full name</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Email</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4 hidden md:table-cell">Firm</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4 hidden lg:table-cell">Message</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4 hidden sm:table-cell">Submitted</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvestors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No pending investors.
                    </td>
                  </tr>
                ) : (
                  pendingInvestors.map((row) => {
                    const isInviting = invitingId === row.id
                    const isRejecting = rejectingId === row.id
                    const busy = isInviting || isRejecting
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-3 text-foreground sm:px-4">{row.full_name}</td>
                        <td className="px-3 py-3 text-muted-foreground sm:px-4 truncate max-w-[140px] sm:max-w-none">{row.email}</td>
                        <td className="px-3 py-3 text-muted-foreground sm:px-4 hidden md:table-cell">{row.firm ?? "—"}</td>
                        <td className="max-w-[160px] truncate px-3 py-3 text-muted-foreground sm:px-4 hidden lg:table-cell">{row.message ?? "—"}</td>
                        <td className="px-3 py-3 sm:px-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground sm:px-4 hidden sm:table-cell whitespace-nowrap">{formatDate(row.submitted_at)}</td>
                        <td className="px-3 py-3 sm:px-4">
                          {row.status === "pending" && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleInvite(row.id, row.email)}
                                disabled={busy}
                              >
                                {isInviting ? (
                                  <>
                                    <Spinner size="sm" className="mr-1.5" />
                                    Inviting…
                                  </>
                                ) : (
                                  "Approve & Invite"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(row.id)}
                                disabled={busy}
                              >
                                {isRejecting ? "Rejecting…" : "Reject"}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="reveals" className="mt-0">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[400px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">User email</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Record name</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">Revealed at</th>
                </tr>
              </thead>
              <tbody>
                {revealActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No reveal activity yet.
                    </td>
                  </tr>
                ) : (
                  revealActivity.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-3 text-muted-foreground sm:px-4 truncate max-w-[160px] sm:max-w-none">{row.user_email ?? "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-4 truncate max-w-[140px] sm:max-w-none">{row.record_name ?? "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-4 whitespace-nowrap">{formatDate(row.revealed_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
