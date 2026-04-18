"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  sectionNumber: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function FormSection({ title, sectionNumber, defaultOpen = false, children }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
            {sectionNumber}
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border bg-card/50 px-5 py-5">
          <div className="flex flex-col gap-5">{children}</div>
        </div>
      )}
    </div>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={cn("text-xs font-medium text-muted-foreground")}>
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {children}
    </div>
  )
}
