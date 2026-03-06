import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Portfolio Database",
}

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return children
}
