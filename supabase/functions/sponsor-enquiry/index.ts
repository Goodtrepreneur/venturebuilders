// Supabase Edge Function: sponsor-enquiry
// Backs the sponsor enquiry form on venturebuilders.fund/events.
//
//   GET  -> issues a signed maths challenge { question, token }
//   POST -> JSON { contact_name, email, organization, job_title, interest, city,
//                  message, website (honeypot), captcha_answer, captcha_token }
//           verifies the challenge, logs the enquiry to public.sponsor_enquiries
//           and emails it to the team via Brevo (reply-to = the enquirer).
//
// Secrets used (already set on this project): BREVO_API_KEY,
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (provided by Supabase).
// The service role key also signs the captcha tokens, so no new secret is needed.

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const RECIPIENTS = [
  { email: "steve@venturebuilders.fund", name: "Steve Hayton" },
  { email: "sarah@venturebuilders.fund", name: "Sarah" },
  { email: "jillian@venturebuilders.fund", name: "Jillian Friot" },
];
const SENDER = { name: "Venture Builders Events", email: "steve@venturebuilders.fund" };

const MIN_SECONDS = 4;          // a human takes longer than this to fill the form
const TOKEN_TTL = 60 * 60 * 2;  // challenge valid for two hours
const MAX_PER_HOUR = 5;         // per IP

const ALLOWED_ORIGINS = [
  "https://venturebuilders.fund",
  "https://www.venturebuilders.fund",
];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".netlify.app") || origin.startsWith("http://localhost")
    ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

const enc = new TextEncoder();
function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode("sponsor-enquiry:" + SERVICE_KEY),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}
async function sha256(data: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return b64url(new Uint8Array(d)).slice(0, 32);
}

async function issueChallenge() {
  const a = 2 + Math.floor(Math.random() * 9);
  const b = 2 + Math.floor(Math.random() * 9);
  const payload = { s: a + b, iat: Math.floor(Date.now() / 1000), n: crypto.randomUUID() };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const token = body + "." + await hmac(body);
  return { question: `What is ${a} + ${b}?`, token };
}

async function verifyChallenge(token: string, answer: string): Promise<string | null> {
  if (!token || !token.includes(".")) return "Please complete the check.";
  const [body, sig] = token.split(".");
  if (await hmac(body) !== sig) return "The check expired. Please try again.";
  let p: { s: number; iat: number };
  try { p = JSON.parse(b64urlDecode(body)); } catch { return "The check expired. Please try again."; }
  const age = Math.floor(Date.now() / 1000) - p.iat;
  if (age > TOKEN_TTL) return "The check expired. Please try again.";
  if (age < MIN_SECONDS) return "That was quick. Please try again.";
  if (parseInt(String(answer).trim(), 10) !== p.s) return "That answer isn't right. Please try again.";
  return null;
}

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function db(path: string, init: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function emailHtml(f: Record<string, string>): string {
  const row = (k: string, v: string) => v
    ? `<tr><td style="padding:6px 16px 6px 0;color:#777;font-size:13px;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:6px 0;color:#0d0d0d;font-size:14px;">${esc(v)}</td></tr>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f2f2f3;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
<tr><td style="background:#0d0d0d;padding:22px 28px;border-bottom:3px solid #E8344E;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#E8344E;">New sponsor enquiry</p>
<p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${esc(f.contact_name)}${f.organization ? ", " + esc(f.organization) : ""}</p>
</td></tr>
<tr><td style="padding:24px 28px;">
<table cellpadding="0" cellspacing="0">
${row("Name", f.contact_name)}${row("Email", f.email)}${row("Organization", f.organization)}${row("Title", f.job_title)}${row("Interested in", f.interest)}${row("City", f.city)}
</table>
<p style="margin:20px 0 6px;color:#777;font-size:13px;">Message</p>
<div style="padding:14px 16px;background:#f7f7f8;border-left:3px solid #E8344E;border-radius:4px;font-size:14px;line-height:1.6;color:#0d0d0d;white-space:pre-wrap;">${esc(f.message)}</div>
<p style="margin:22px 0 0;font-size:13px;color:#777;">Reply to this email to respond directly to ${esc(f.contact_name)}. Sent from venturebuilders.fund/events.</p>
</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

  if (req.method === "GET") return json(req, await issueChallenge());

  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json(req, { error: "Invalid request." }, 400); }

  // Honeypot: real people never see or fill this field. Pretend success.
  if (clean(p.website, 200)) return json(req, { ok: true });

  const f = {
    contact_name: clean(p.contact_name, 120),
    email: clean(p.email, 200).toLowerCase(),
    organization: clean(p.organization, 160),
    job_title: clean(p.job_title, 120),
    interest: clean(p.interest, 120),
    city: clean(p.city, 120),
    message: clean(p.message, 4000),
  };
  if (!f.contact_name || !f.message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) {
    return json(req, { error: "Please add your name, a valid email and a message." }, 400);
  }

  const captchaErr = await verifyChallenge(clean(p.captcha_token, 600), clean(p.captcha_answer, 10));
  if (captchaErr) return json(req, { error: captchaErr, retry_captcha: true }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = await sha256("vbf-ip:" + ip);

  // Simple per-IP rate limit
  const since = new Date(Date.now() - 3600_000).toISOString();
  const rl = await db(`sponsor_enquiries?select=id&ip_hash=eq.${ipHash}&created_at=gte.${since}`, { method: "GET" });
  if (rl.ok) {
    const rows = await rl.json();
    if (Array.isArray(rows) && rows.length >= MAX_PER_HOUR) {
      return json(req, { error: "Too many messages from this connection. Please email hello@venturebuilders.fund." }, 429);
    }
  }

  const ins = await db("sponsor_enquiries", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...f,
      source_page: clean(p.source_page, 200) || "events",
      ip_hash: ipHash,
      user_agent: clean(req.headers.get("user-agent"), 300),
    }),
  });
  let id: string | null = null;
  if (ins.ok) { const r = await ins.json(); id = r?.[0]?.id ?? null; }
  else console.error("Insert failed:", await ins.text());

  const subject = `Sponsor enquiry: ${f.contact_name}${f.organization ? " (" + f.organization + ")" : ""}`;
  const mail = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: SENDER,
      to: RECIPIENTS,
      replyTo: { email: f.email, name: f.contact_name },
      subject,
      htmlContent: emailHtml(f),
      tags: ["sponsor-enquiry"],
    }),
  });
  const sent = mail.ok;
  if (!sent) console.error("Brevo error:", await mail.text());
  if (id) await db(`sponsor_enquiries?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ email_sent: sent }) });

  if (!sent && !id) return json(req, { error: "Something went wrong. Please email hello@venturebuilders.fund." }, 500);
  return json(req, { ok: true });
});
