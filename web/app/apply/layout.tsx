import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request Access",
}

export default function ApplyLayout({
  children,
}: { children: React.ReactNode }) {
  return children
}
