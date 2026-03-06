// Supabase Edge Function: sync-to-airtable
// POST body: a Supabase table row (object with id, optional airtable_id, and other fields).
// - If no airtable_id: create Airtable record, then update Supabase row with the new Airtable record id.
// - If airtable_id present: PATCH the existing Airtable record.
// All fields except id, airtable_id, and email are sent to Airtable.
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE, DB_URL, DB_SERVICE_KEY, SUPABASE_TABLE

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SKIP_KEYS = new Set(["id", "airtable_id", "email"])

function buildAirtableFields(record: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.has(key)) continue
    if (value === undefined) continue
    fields[key] = value
  }
  return fields
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  let record: Record<string, unknown>
  try {
    record = (await req.json()) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const id = record.id
  if (id === undefined || id === null) {
    return new Response(JSON.stringify({ error: "Record must include id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const airtableToken = Deno.env.get("AIRTABLE_TOKEN")
  const airtableBaseId = Deno.env.get("AIRTABLE_BASE_ID")
  const airtableTable = Deno.env.get("AIRTABLE_TABLE")
  const supabaseUrl = Deno.env.get("DB_URL")
  const supabaseServiceKey = Deno.env.get("DB_SERVICE_KEY")
  const supabaseTable = Deno.env.get("SUPABASE_TABLE")

  if (!airtableToken || !airtableBaseId || !airtableTable) {
    console.error("sync-to-airtable: Missing AIRTABLE_* env")
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (!supabaseUrl || !supabaseServiceKey || !supabaseTable) {
    console.error("sync-to-airtable: Missing SUPABASE_* or DB_* env")
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const fields = buildAirtableFields(record)
  const airtableRecordId = record.airtable_id as string | undefined | null
  const baseUrl = `https://api.airtable.com/v0/${encodeURIComponent(airtableBaseId)}/${encodeURIComponent(airtableTable)}`
  const headers = {
    Authorization: `Bearer ${airtableToken}`,
    "Content-Type": "application/json",
  }

  try {
    if (!airtableRecordId) {
      // Create in Airtable
      const createRes = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ records: [{ fields }] }),
      })
      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error("sync-to-airtable: Airtable create failed", createRes.status, errText)
        return new Response(
          JSON.stringify({ error: "Airtable create failed", details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      const createData = (await createRes.json()) as { records?: { id: string }[] }
      const newId = createData?.records?.[0]?.id
      if (!newId) {
        console.error("sync-to-airtable: No record id in Airtable response")
        return new Response(
          JSON.stringify({ error: "Airtable did not return record id" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      // Write Airtable ID back to Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { error: updateError } = await supabase
        .from(supabaseTable)
        .update({ airtable_id: newId })
        .eq("id", id)
      if (updateError) {
        console.error("sync-to-airtable: Supabase update failed", updateError.message)
        return new Response(
          JSON.stringify({ error: "Failed to save Airtable id to Supabase", details: updateError.message }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      return new Response(JSON.stringify({ ok: true, airtable_id: newId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update existing Airtable record
    const patchUrl = `${baseUrl}/${encodeURIComponent(airtableRecordId)}`
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields }),
    })
    if (!patchRes.ok) {
      const errText = await patchRes.text()
      console.error("sync-to-airtable: Airtable PATCH failed", patchRes.status, errText)
      return new Response(
        JSON.stringify({ error: "Airtable update failed", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error("sync-to-airtable: Unexpected error", e)
    return new Response(
      JSON.stringify({ error: "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
