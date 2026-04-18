"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getEmailForRecord(recordId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("founder_startups_latest")
    .select("email")
    .eq("id", recordId)
    .eq("third_party_consent", true)
    .single()

  if (error) return { email: null, error: error.message }
  return { email: (data?.email as string) ?? null }
}

/**
 * Returns true if this investor has already revealed this founder record (Pattern A).
 * Uses service-role client when available so duplicate detection is reliable regardless of RLS on email_reveals.
 */
async function hasExistingEmailReveal(
  userId: string,
  recordIdStr: string
): Promise<boolean> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from("email_reveals")
        .select("id")
        .eq("user_id", userId)
        .eq("record_id", recordIdStr)
        .maybeSingle()
      if (!error) return !!data
      console.error("[email_reveals] duplicate check (admin):", error.message)
    } catch (e) {
      console.error("[email_reveals] duplicate check (admin):", e)
    }
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from("email_reveals")
    .select("id")
    .eq("user_id", userId)
    .eq("record_id", recordIdStr)
    .maybeSingle()
  return !!data
}

export async function logEmailReveal(
  recordId: string,
  recordName: string | null
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const recordIdStr = String(recordId)
  const user_email = user.email ?? null

  const alreadyRevealed = await hasExistingEmailReveal(user.id, recordIdStr)
  if (alreadyRevealed) {
    return {}
  }

  const revealed_at = new Date().toISOString()

  const { error } = await supabase.from("email_reveals").insert({
    user_id: user.id,
    record_id: recordIdStr,
    record_name: recordName ?? null,
    user_email,
    revealed_at,
  })

  if (error) return { error: error.message }

  const investor_name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    null

  // Fire-and-forget: notify founder that an investor has revealed their contact.
  // Intentionally not awaited — response to the investor must not wait on this.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-founder-interest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          record_id: recordIdStr,
          investor_email: user_email,
          investor_name,
        }),
      }
    ).catch((err) => {
      console.error("[notify-founder-interest] dispatch failed:", err)
    })
  }

  // Notify Slack + Airtable via Edge Function (fire-and-forget; don't block or fail the action)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    fetch(`${SUPABASE_URL}/functions/v1/notify-reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_email,
        record_name: recordName ?? null,
        record_id: recordIdStr,
        revealed_at,
      }),
    }).catch((err) => {
      console.error("notify-reveal Edge Function call failed:", err)
    })
  }

  return {}
}
