"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitApplication(formData: {
  fullName: string
  email: string
  firm?: string | null
  message?: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("pending_investors").insert({
    full_name: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    firm: formData.firm?.trim() || null,
    message: formData.message?.trim() || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}
