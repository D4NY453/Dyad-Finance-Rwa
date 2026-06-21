"use client"

import { RefreshCw } from "lucide-react"
import type { Balances } from "@/hooks/use-vault"

type BalancePanelProps = {
  balances: Balances
  refreshing: boolean
  connected: boolean
  onRefresh: () => void
}

const ITEMS = [
  {
    key: "eth" as const,
    label: "ETH Balance",
    symbol: "ETH",
    accent: "text-foreground",
    glow: "from-foreground/5",
  },
  {
    key: "stable" as const,
    label: "Stable Token",
    symbol: "usdJ",
    accent: "text-vault-stable",
    glow: "from-vault-stable/10",
  },
  {
    key: "volatile" as const,
    label: "Volatile Token",
    symbol: "jETH",
    accent: "text-vault-indigo",
    glow: "from-vault-indigo/10",
  },
]

export function BalancePanel({ balances, refreshing, connected, onRefresh }: BalancePanelProps) {
  return (
    <section aria-label="Saldos de la bóveda">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Tu posición
        </h2>
        <button
          onClick={onRefresh}
          disabled={!connected || refreshing}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-vault-cyan/40 hover:text-vault-cyan disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-vault-cyan/20"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.glow} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-center text-center">
              <span className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                {item.label}
              </span>
              <span className={`font-mono text-4xl font-bold tabular-nums ${item.accent}`}>
                {connected ? balances[item.key] : "--"}
              </span>
              <span className="mt-2 text-xs text-muted-foreground">{item.symbol}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
