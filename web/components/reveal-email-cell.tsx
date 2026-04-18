"use client"

import { useState } from "react"
import { getEmailForRecord, logEmailReveal } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface RevealEmailCellProps {
  recordId: string
  recordName: string | null
}

export function RevealEmailCell({ recordId, recordName }: RevealEmailCellProps) {
  const [revealed, setRevealed] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleReveal() {
    setLoading(true)
    try {
      const { email: fetchedEmail, error } = await getEmailForRecord(recordId)
      if (error || !fetchedEmail) {
        setEmail(null)
        setRevealed(true)
        return
      }
      setEmail(fetchedEmail)
      setRevealed(true)
      await logEmailReveal(recordId, recordName)
    } finally {
      setLoading(false)
    }
  }

  if (revealed) {
    return (
      <span className="text-sm text-foreground">
        {email ?? "—"}
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleReveal}
      disabled={loading}
      className="min-w-[7rem]"
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-1.5" />
          Loading…
        </>
      ) : (
        "Reveal Email"
      )}
    </Button>
  )
}
