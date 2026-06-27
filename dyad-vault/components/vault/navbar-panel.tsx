"use client"

import { Moon, Sun, Wallet, LogOut, Loader2 } from "lucide-react"

function truncate(addr: string) {
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
}

type NavbarProps = {
  account: string
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function Navbar({ account, connecting, onConnect, onDisconnect }: NavbarProps) {
  return (
    <nav className="relative z-10 flex items-center justify-end border-b border-white/5 px-6 py-5 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Botón de claro/oscuro funcional */}
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.contains('dark')
            if (isDark) {
              document.documentElement.classList.remove('dark')
            } else {
              document.documentElement.classList.add('dark')
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-all hover:bg-white/5 hover:text-white"
          aria-label="Alternar tema"
        >
          <Sun className="h-5 w-5 hidden dark:block text-yellow-400" />
          <Moon className="h-5 w-5 block dark:hidden text-zinc-600" />
        </button>

        {account ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-vault-cyan/30 bg-vault-cyan/5 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-vault-stable shadow-[0_0_8px_var(--vault-stable)]" aria-hidden="true" />
              <span className="font-mono text-sm text-foreground">{truncate(account)}</span>
            </div>
            <button
              onClick={onDisconnect}
              aria-label="Desconectar wallet"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="group flex items-center gap-2 rounded-full border border-vault-cyan/40 bg-vault-cyan/10 px-6 py-2.5 font-medium text-vault-cyan transition-all hover:bg-vault-cyan/20 hover:shadow-[0_0_24px_-4px_var(--vault-cyan)] disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wallet className="h-4 w-4" aria-hidden="true" />
            )}
            {connecting ? "Conectando..." : "Conectar Wallet"}
          </button>
        )}
      </div>
    </nav>
  )
}
