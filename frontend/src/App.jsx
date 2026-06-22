import React, { useState, useEffect } from "react";
import Header          from "./components/Header";
import SwapSimulator   from "./components/SwapSimulator";
import LimitOrders     from "./components/LimitOrders";
import LoyaltyDashboard from "./components/LoyaltyDashboard";
import Faucet          from "./components/Faucet";
import Settings        from "./components/Settings";
import FlashLoan       from "./components/FlashLoan";
import { useWallet }   from "./hooks/useWallet";
import { useContracts } from "./hooks/useContracts";
import { DEFAULT_ADDRESSES } from "./contracts/addresses";
import "./index.css";

const TABS = [
  { id: "swap",    icon: "🔄", label: "Swap"          },
  { id: "orders",  icon: "📋", label: "Límit Orders"  },
  { id: "loyalty", icon: "🏆", label: "Loyalty"       },
  { id: "flash",   icon: "⚡", label: "Flash Loans"   },
  { id: "faucet",  icon: "🚰", label: "Faucet"        },
  { id: "settings",icon: "⚙️",  label: "Settings"      },
];

export default function App() {
  const [tab,       setTab]       = useState("swap");
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hook_addresses")) || DEFAULT_ADDRESSES; }
    catch { return DEFAULT_ADDRESSES; }
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const wallet    = useWallet();
  const contracts = useContracts(wallet.signer, addresses);

  const saveAddresses = (addr) => {
    setAddresses(addr);
    localStorage.setItem("hook_addresses", JSON.stringify(addr));
  };

  const refresh = () => setRefreshKey(k => k + 1);

  const contractsReady = !!wallet.account && !!contracts.hook;

  return (
    <div className="app">
      {/* Fondo animado */}
      <div className="bg-grid" />
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <Header
        account={wallet.account}
        chainId={wallet.chainId}
        connecting={wallet.connecting}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
        shortAddress={wallet.shortAddress}
      />

      <div className="layout">
        {/* Sidebar */}
        <nav className="sidebar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sidebar-btn ${tab === t.id ? "sidebar-btn-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="sidebar-icon">{t.icon}</span>
              <span className="sidebar-label">{t.label}</span>
            </button>
          ))}

          {/* Indicador de estado de contratos */}
          <div className="sidebar-status">
            <div className={`status-dot ${contractsReady ? "status-ok" : "status-warn"}`} />
            <span>{contractsReady ? "Contratos conectados" : "Sin contratos"}</span>
          </div>
        </nav>

        {/* Contenido principal */}
        <main className="main-content">
          {/* Banner si no hay wallet */}
          {!wallet.account && tab !== "settings" && (
            <div className="alert alert-info banner">
              <span>🦊</span>
              <div>
                <strong>Conecta MetaMask para interactuar con los contratos</strong>
                <p>O configura las direcciones en ⚙️ Settings para ver la interfaz</p>
              </div>
              <button className="btn btn-primary" onClick={wallet.connect}>Conectar</button>
            </div>
          )}

          {/* Banner si hay wallet pero no contratos */}
          {wallet.account && !contracts.hook && tab !== "settings" && (
            <div className="alert alert-warning banner">
              <span>⚠️</span>
              <div>
                <strong>Configura las direcciones de los contratos</strong>
                <p>Ve a ⚙️ Settings y pega las direcciones de Remix</p>
              </div>
              <button className="btn btn-outline" onClick={() => setTab("settings")}>
                Ir a Settings
              </button>
            </div>
          )}

          {wallet.error && (
            <div className="alert alert-error banner">{wallet.error}</div>
          )}

          {/* Paneles */}
          {tab === "swap" && (
            <SwapSimulator
              key={refreshKey}
              hook={contracts.hook}
              tokenA={addresses.tokenA}
              tokenB={addresses.tokenB}
              account={wallet.account}
              onRefresh={refresh}
            />
          )}
          {tab === "orders" && (
            <LimitOrders
              key={refreshKey}
              hook={contracts.hook}
              tokenAAddr={addresses.tokenA}
              tokenBAddr={addresses.tokenB}
              account={wallet.account}
              onRefresh={refresh}
            />
          )}
          {tab === "loyalty" && (
            <LoyaltyDashboard
              key={refreshKey}
              hook={contracts.hook}
              account={wallet.account}
              onRefresh={refresh}
            />
          )}
          {tab === "flash" && (
            <FlashLoan
              key={refreshKey}
              hook={contracts.hook}
              tokenA={addresses.tokenA}
              tokenB={addresses.tokenB}
              account={wallet.account}
              onRefresh={refresh}
            />
          )}
          {tab === "faucet" && (
            <Faucet
              tokenA={contracts.tokenA}
              tokenB={contracts.tokenB}
              account={wallet.account}
              tokenAAddr={addresses.tokenA}
              tokenBAddr={addresses.tokenB}
            />
          )}
          {tab === "settings" && (
            <Settings addresses={addresses} onSave={saveAddresses} />
          )}
        </main>
      </div>
    </div>
  );
}
