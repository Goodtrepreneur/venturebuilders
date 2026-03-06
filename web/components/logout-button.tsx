"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function LogoutButton({
  className,
  variant = "ghost",
  size = "default",
  children = "Sign out",
}: LogoutButtonProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
    >
      {children}
    </Button>
  )
}
