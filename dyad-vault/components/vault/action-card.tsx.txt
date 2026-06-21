"use client"

import { useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

type Accent = "cyan" | "stable" | "indigo"

const ACCENT_MAP: Record<
  Accent,
  { bar: string; ring: string; focus: string; button: string; iconWrap: string; iconColor: string }
> = {
  cyan: {
    bar: "from-vault-cyan to-vault-indigo",
    ring: "hover:border-vault-cyan/30",
    focus: "focus:border-vault-cyan focus:ring-vault-cyan/20",
    button:
      "bg-vault-cyan text-primary-foreground hover:shadow-[0_0_24px_-4px_var(--vault-cyan)]",
    iconWrap: "bg-vault-cyan/10 ring-vault-cyan/30",
    iconColor: "text-vault-cyan",
  },
  stable: {
    bar: "from-vault-stable to-vault-cyan",
    ring: "hover:border-vault-stable/30",
    focus: "focus:border-vault-stable focus:ring-vault-stable/20",
    button:
      "bg-vault-stable text-primary-foreground hover:shadow-[0_0_24px_-4px_var(--vault-stable)]",
    iconWrap: "bg-vault-stable/10 ring-vault-stable/30",
    iconColor: "text-vault-stable",
  },
  indigo: {
    bar: "from-vault-indigo to-vault-cyan",
    ring: "hover:border-vault-indigo/30",
    focus: "focus:border-vault-indigo focus:ring-vault-indigo/20",
    button:
      "bg-vault-indigo text-accent-foreground hover:shadow-[0_0_24px_-4px_var(--vault-indigo)]",
    iconWrap: "bg-vault-indigo/10 ring-vault-indigo/30",
    iconColor: "text-vault-indigo",
  },
}

type ActionCardProps = {
  title: string
  description: string
  placeholder: string
  cta: string
  loadingLabel: string
  accent: Accent
  icon: ReactNode
  loading: boolean
  disabled: boolean
  maxValue: string
  maxSymbol: string
  onSubmit: (amount: string) => Promise<boolean | undefined> | void
}

export function ActionCard({
  title,
  description,
  placeholder,
  cta,
  loadingLabel,
  accent,
  icon,
  loading,
  disabled,
  maxValue,
  maxSymbol,
  onSubmit,
}: ActionCardProps) {
  const [value, setValue] = useState("")
  const styles = ACCENT_MAP[accent]

  const numericMax = Number(maxValue)
  const hasBalance = Number.isFinite(numericMax) && numericMax > 0

  const handleSubmit = async () => {
    const ok = await onSubmit(value)
    if (ok) setValue("")
  }

  const handleMax = () => {
    if (hasBalance) setValue(maxValue)
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors ${styles.ring}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.bar} opacity-40 transition-opacity group-hover:opacity-100`}
        aria-hidden="true"
      />

      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${styles.iconWrap}`}>
          <span className={styles.iconColor}>{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Disponible</span>
          <span className="font-mono text-muted-foreground">
            {hasBalance ? numericMax.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "0"}{" "}
            {maxSymbol}
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled || loading}
            className={`w-full rounded-xl border border-input bg-background px-4 py-3 pr-16 font-mono text-foreground outline-none ring-0 transition-all placeholder:text-muted-foreground/60 focus:ring-4 disabled:opacity-50 ${styles.focus}`}
          />
          <button
            type="button"
            onClick={handleMax}
            disabled={disabled || loading || !hasBalance}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40 ${styles.iconWrap} ${styles.iconColor} ring-1 hover:brightness-125`}
          >
            Max
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || loading}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? loadingLabel : cta}
        </button>
      </div>
    </div>
  )
}
