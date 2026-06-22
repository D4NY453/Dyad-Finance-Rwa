"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Rocket, ShieldCheck, TrendingUp, AlertTriangle, Wallet, Coins, Home } from "lucide-react"
import { useVault } from "@/hooks/use-vault"
import { Navbar } from "./navbar-panel"
import { BalancePanel } from "./balance-panel"
import { ActionCard } from "./action-card"
import { ToastStack } from "./toast-stack"
import { RwaPanel } from "./rwa-panel"
import { PortfolioPanel } from "./portfolio-panel"
import { SwapPanel } from "./swap-panel"

export function VaultDashboard() {
  const {
    account,
    connecting,
    wrongNetwork,
    balances,
    loading,
    refreshing,
    toasts,
    connectWallet,
    disconnect,
    switchToSepolia,
    loadBalances,
    runAction,
    dismissToast,
  } = useVault()

  const connected = Boolean(account)
  const [activeTab, setActiveTab] = useState<'crypto' | 'rwa' | 'portfolio' | 'swap'>('crypto')

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--vault-indigo),transparent_60%)] opacity-25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_10%,var(--vault-cyan),transparent_55%)] opacity-10"
        aria-hidden="true"
      />

      <Navbar
        account={account}
        connecting={connecting}
        onConnect={connectWallet}
        onDisconnect={disconnect}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-12">
        {/* Hero */}
        <header className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-vault-cyan shadow-[0_0_8px_var(--vault-cyan)]" aria-hidden="true" />
            Red de pruebas Sepolia
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Deposita ETH. Acuña{" "}
            <span className="text-vault-stable">estabilidad</span> y{" "}
            <span className="text-vault-indigo">volatilidad</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            La bóveda divide tu depósito en un token estable (usdJ) y un token
            volátil apalancado (jETH), canjeables por su valor en ETH cuando
            quieras.
          </p>
        </header>

        {/* Wrong network banner */}
        {wrongNetwork && (
          <div className="mb-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Estás en la red incorrecta. Cambia a Sepolia para operar.
            </div>
            <button
              onClick={switchToSepolia}
              className="rounded-full border border-destructive/40 bg-destructive/20 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-destructive/30"
            >
              Cambiar a Sepolia
            </button>
          </div>
        )}

        <div className="mb-12">
          <BalancePanel
            balances={balances}
            refreshing={refreshing}
            connected={connected}
            onRefresh={loadBalances}
          />
        </div>

        {/* TABS NAVIGATION */}
        <div className="mb-10 flex justify-center">
          <div className="flex rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('crypto')}
              className={`relative flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'crypto' ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {activeTab === 'crypto' && (
                <motion.div
                  layoutId="mainTabs"
                  className="absolute inset-0 rounded-full bg-vault-cyan/20 border border-vault-cyan/50 shadow-[0_0_15px_rgba(138,235,255,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Coins className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Bóveda Cripto (L1)</span>
            </button>

            <button
              onClick={() => setActiveTab('rwa')}
              className={`relative flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'rwa' ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {activeTab === 'rwa' && (
                <motion.div
                  layoutId="mainTabs"
                  className="absolute inset-0 rounded-full bg-vault-indigo/20 border border-vault-indigo/50 shadow-[0_0_15px_rgba(187,201,205,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Home className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Bóveda Inmobiliaria (RWA)</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`relative flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'portfolio' ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {activeTab === 'portfolio' && (
                <motion.div
                  layoutId="mainTabs"
                  className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Wallet className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Mi Billetera</span>
            </button>

            <button
              onClick={() => setActiveTab('swap')}
              className={`relative flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'swap' ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {activeTab === 'swap' && (
                <motion.div
                  layoutId="mainTabs"
                  className="absolute inset-0 rounded-full bg-vault-stable/20 border border-vault-stable/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">⚡ Swap</span>
            </button>
          </div>
        </div>

        {/* Connect prompt overlay state */}
        {!connected && (
          <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-vault-cyan/30 bg-card/40 px-6 py-10 text-center backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vault-cyan/10 ring-1 ring-vault-cyan/30">
              <Wallet className="h-6 w-6 text-vault-cyan" aria-hidden="true" />
            </div>
            <p className="max-w-sm text-pretty text-muted-foreground">
              Conecta tu wallet para ver tus saldos e interactuar con la bóveda.
            </p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="rounded-full border border-vault-cyan/40 bg-vault-cyan/10 px-6 py-2.5 font-medium text-vault-cyan transition-all hover:bg-vault-cyan/20 hover:shadow-[0_0_24px_-4px_var(--vault-cyan)] disabled:opacity-60"
            >
              {connecting ? "Conectando..." : "Conectar Wallet"}
            </button>
          </div>
        )}

        {/* DYNAMIC CONTENT BASED ON ACTIVE TAB */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'crypto' && (
              <motion.div
                key="crypto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <section
                  className="grid grid-cols-1 gap-6 md:grid-cols-3"
                  aria-label="Acciones de la bóveda"
                >
                  <ActionCard
                    title="Entrar a la bóveda"
                    description="Deposita ETH para acuñar usdJ y jETH automáticamente."
                    placeholder="0.0 ETH"
                    cta="Depositar ETH"
                    loadingLabel="Procesando..."
                    accent="cyan"
                    icon={<Rocket className="h-5 w-5" aria-hidden="true" />}
                    loading={loading.deposit}
                    disabled={!connected}
                    maxValue={balances.eth}
                    maxSymbol="ETH"
                    onSubmit={(amount) => runAction("deposit", amount)}
                  />
                  <ActionCard
                    title="Retiro seguro"
                    description="Canjea tus usdJ y la bóveda te devolverá su valor en ETH."
                    placeholder="0.0 usdJ"
                    cta="Canjear usdJ"
                    loadingLabel="Procesando..."
                    accent="stable"
                    icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                    loading={loading.redeemStable}
                    disabled={!connected}
                    maxValue={balances.stable}
                    maxSymbol="usdJ"
                    onSubmit={(amount) => runAction("redeemStable", amount)}
                  />
                  <ActionCard
                    title="Retiro apalancado"
                    description="Canjea jETH para capturar las ganancias del ETH sobrante."
                    placeholder="0.0 jETH"
                    cta="Canjear jETH"
                    loadingLabel="Procesando..."
                    accent="indigo"
                    icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
                    loading={loading.redeemVolatile}
                    disabled={!connected}
                    maxValue={balances.volatile}
                    maxSymbol="jETH"
                    onSubmit={(amount) => runAction("redeemVolatile", amount)}
                  />
                </section>
              </motion.div>
            )}

            {activeTab === 'rwa' && (
              <motion.div
                key="rwa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RwaPanel balances={balances} />
              </motion.div>
            )}

            {activeTab === 'portfolio' && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PortfolioPanel balances={balances} />
              </motion.div>
            )}

            {activeTab === 'swap' && (
              <motion.div
                key="swap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SwapPanel balances={balances} onRefresh={loadBalances} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
