"use client"

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import type { Toast } from "@/hooks/use-vault"

const CONFIG = {
  success: {
    icon: CheckCircle2,
    cls: "border-vault-stable/40 bg-vault-stable/10 text-vault-stable",
  },
  error: {
    icon: AlertCircle,
    cls: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  info: {
    icon: Info,
    cls: "border-vault-cyan/40 bg-vault-cyan/10 text-vault-cyan",
  },
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const { icon: Icon, cls } = CONFIG[toast.type]
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${cls}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm leading-relaxed text-foreground">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
