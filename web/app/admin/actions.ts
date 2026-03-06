"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function inviteInvestor(id: string, email: string) {
  const admin = createAdminClient()
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)
  if (inviteError) return { error: inviteError.message }

  const { error: updateError } = await admin
    .from("pending_investors")
    .update({ status: "invited", invited_at: new Date().toISOString() })
    .eq("id", id)

  if (updateError) return { error: updateError.message }
  return {}
}

export async function rejectInvestor(id: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from("pending_investors")
    .update({ status: "rejected" })
    .eq("id", id)

  if (error) return { error: error.message }
  return {}
}
