"use client"

import { RevealEmailCell } from "@/components/reveal-email-cell"

export interface FounderbaseRow {
  id: string
  recordName: string | null
  [key: string]: unknown
}

interface FounderbaseTableProps {
  columns: string[]
  rows: FounderbaseRow[]
}

function formatCellValue(value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toLocaleString()
  return String(value)
}

function formatColumnLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FounderbaseTable({ columns, rows }: FounderbaseTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-12 text-center sm:px-6">
        <p className="text-muted-foreground">No records yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">When records are added, they will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((key) => (
                <th
                  key={key}
                  className="px-3 py-3 text-left font-medium text-foreground sm:px-4"
                >
                  {formatColumnLabel(key)}
                </th>
              ))}
              <th className="px-3 py-3 text-left font-medium text-foreground sm:px-4">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                {columns.map((key) => (
                  <td key={key} className="px-3 py-3 text-muted-foreground sm:px-4">
                    {formatCellValue(row[key])}
                  </td>
                ))}
                <td className="px-3 py-3 sm:px-4">
                  <RevealEmailCell
                    recordId={row.id}
                    recordName={row.recordName ?? null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
