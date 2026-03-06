// Supabase Edge Function: notify-reveal
// POST body: { user_email, record_name, record_id, revealed_at }
// Runs Slack notification and Airtable create in parallel; returns 200, logs failures.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface NotifyBody {
  user_email: string
  record_name: string | null
  record_id: string
  revealed_at: string
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

  let body: NotifyBody
  try {
    body = (await req.json()) as NotifyBody
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { user_email, record_name, record_id, revealed_at } = body
  const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL")
  const airtableToken = Deno.env.get("AIRTABLE_TOKEN")
  const airtableBaseId = Deno.env.get("AIRTABLE_BASE_ID")

  const slackMessage = `👀 ${user_email} revealed the email for ${record_name ?? record_id} at ${revealed_at}`

  const slackPromise = (async () => {
    if (!slackWebhookUrl) {
      console.error("notify-reveal: SLACK_WEBHOOK_URL not set")
      return
    }
    try {
      const res = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: slackMessage }),
      })
      if (!res.ok) {
        console.error("notify-reveal: Slack webhook failed", res.status, await res.text())
      }
    } catch (e) {
      console.error("notify-reveal: Slack request error", e)
    }
  })()

  const airtablePromise = (async () => {
    if (!airtableToken || !airtableBaseId) {
      console.error("notify-reveal: AIRTABLE_TOKEN or AIRTABLE_BASE_ID not set")
      return
    }
    try {
      const tableName = "Email Reveals"
      const url = `https://api.airtable.com/v0/${encodeURIComponent(airtableBaseId)}/${encodeURIComponent(tableName)}`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                User: user_email,
                Record: record_name ?? record_id,
                "Revealed At": revealed_at,
              },
            },
          ],
        }),
      })
      if (!res.ok) {
        console.error("notify-reveal: Airtable create failed", res.status, await res.text())
      }
    } catch (e) {
      console.error("notify-reveal: Airtable request error", e)
    }
  })()

  await Promise.all([slackPromise, airtablePromise])

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
