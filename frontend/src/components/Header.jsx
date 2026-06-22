import React from "react";

export default function Header({ account, chainId, connecting, onConnect, onDisconnect, shortAddress }) {
  const networkName = {
    1:        "Mainnet",
    11155111: "Sepolia",
    31337:    "Hardhat",
    1337:     "Remix VM",
  }[chainId] ?? `Chain ${chainId}`;

  return (
    <header className="header">
      <div className="header-brand">
        <span className="brand-logo">🦄</span>
        <div>
          <span className="brand-title">UniHook</span>
          <span className="brand-sub">v4 · Limit Orders & Loyalty</span>
        </div>
      </div>

      <div className="header-right">
        {account && (
          <div className="network-badge">
            <span className="network-dot" />
            {networkName}
          </div>
        )}

        {account ? (
          <div className="wallet-connected" onClick={onDisconnect} title="Click para desconectar">
            <span className="wallet-avatar">👤</span>
            <span className="wallet-addr">{shortAddress}</span>
            <span className="wallet-disconnect">✕</span>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onConnect} disabled={connecting}>
            {connecting ? (
              <><span className="spinner" /> Conectando…</>
            ) : (
              <><span>🦊</span> Conectar MetaMask</>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
