// Supabase Edge Function: subscribe-pivot
// POST JSON: { email, first_name }
// Adds/updates contact in Brevo (list + FIRSTNAME attribute).

const ALLOWED_ORIGINS = new Set([
  "https://venturebuilders.fund",
  "https://www.venturebuilders.fund",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
])

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || ""
  const allowOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://venturebuilders.fund"

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  const brevoApiKey = Deno.env.get("BREVO_API_KEY")
  if (!brevoApiKey) {
    return new Response(JSON.stringify({ error: "Missing BREVO_API_KEY" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  const listIdRaw = Deno.env.get("BREVO_LIST_ID") || "9"
  const listId = parseInt(listIdRaw, 10)
  if (Number.isNaN(listId)) {
    return new Response(JSON.stringify({ error: "Invalid BREVO_LIST_ID" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  let body: { email?: string; first_name?: string | null }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  const email = (body.email || "").trim().toLowerCase()
  const firstName = (body.first_name ?? "").toString().trim()

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  const brevoBody = {
    email,
    attributes: {
      FIRSTNAME: firstName,
    },
    listIds: [listId],
    updateEnabled: true,
  }

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(brevoBody),
    })

    if (!brevoRes.ok) {
      const errText = await brevoRes.text()
      return new Response(
        JSON.stringify({
          error: "Brevo request failed",
          status: brevoRes.status,
          details: errText,
        }),
        {
          status: 502,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    )
  }
})
