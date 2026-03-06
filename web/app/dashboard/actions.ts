"use server"

import { createClient } from "@/lib/supabase/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getEmailForRecord(recordId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("founderbase")
    .select("email")
    .eq("id", recordId)
    .single()

  if (error) return { email: null, error: error.message }
  return { email: (data?.email as string) ?? null }
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

  const revealed_at = new Date().toISOString()
  const user_email = user.email ?? null

  const { error } = await supabase.from("email_reveals").insert({
    user_id: user.id,
    record_id: String(recordId),
    record_name: recordName ?? null,
    user_email,
    revealed_at,
  })

  if (error) return { error: error.message }

  // Notify Slack + Airtable via Edge Function (fire-and-forget; don’t block or fail the action)
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
        record_id: String(recordId),
        revealed_at,
      }),
    }).catch((err) => {
      console.error("notify-reveal Edge Function call failed:", err)
    })
  }

  return {}
}
