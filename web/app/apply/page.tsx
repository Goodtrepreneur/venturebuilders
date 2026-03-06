"use client"

import { useState } from "react"
import { submitApplication } from "@/app/apply/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ApplyPage() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = {
      fullName: (form.elements.namedItem("fullName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      firm: (form.elements.namedItem("firm") as HTMLInputElement).value || null,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value || null,
    }

    const result = await submitApplication(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    toast.success("Application submitted", {
      description: "Thanks — we'll be in touch if you're a good fit.",
    })
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <p className="max-w-md text-center text-lg text-foreground">
          Thanks — we&apos;ll be in touch if you&apos;re a good fit.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-xl font-medium tracking-tight text-foreground">
          Apply
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Your name"
              disabled={loading}
              autoComplete="name"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firm">Firm / Organization</Label>
            <Input
              id="firm"
              name="firm"
              type="text"
              placeholder="Optional"
              disabled={loading}
              autoComplete="organization"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Why are you interested?</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Optional"
              rows={4}
              disabled={loading}
              className="resize-y bg-background"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </div>
    </main>
  )
}
