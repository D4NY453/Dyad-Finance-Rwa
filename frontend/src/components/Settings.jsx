import React, { useState } from "react";
import { fmt } from "../hooks/useContracts";

export default function Settings({ addresses, onSave }) {
  const [form, setForm] = useState({ ...addresses });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (key, label, placeholder) => (
    <div className="form-field" key={key}>
      <label className="field-label">{label}</label>
      <input
        className="input input-mono"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder || "0x..."}
        spellCheck={false}
      />
    </div>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">⚙️ Configuración</h2>
        <p className="panel-desc">Pega aquí las direcciones de los contratos desplegados en Remix</p>
      </div>

      <div className="card">
        <h3 className="card-title">📄 Direcciones de Contratos</h3>
        <div className="settings-form">
          {field("hook",         "🪝 LimitOrderLoyaltyHook")}
          {field("tokenA",       "🪙 Token A (TKA) — MockERC20")}
          {field("tokenB",       "🪙 Token B (TKB) — MockERC20")}
          {field("loyaltyToken", "⭐ LoyaltyToken (SLP)")}
        </div>
        <button className="btn btn-primary btn-full" onClick={handleSave}>
          {saved ? "✅ Guardado" : "💾 Guardar Configuración"}
        </button>
      </div>

      <div className="card card-dim">
        <h3 className="card-title">📋 Pasos para obtener las direcciones</h3>
        <ol className="info-list">
          <li>Abre <strong>Remix IDE</strong> → <a href="https://remix.ethereum.org" target="_blank" rel="noreferrer" className="link">remix.ethereum.org</a></li>
          <li>Sube los archivos <code>.sol</code> de la carpeta <code>src/</code></li>
          <li>Compila con <strong>Solidity 0.8.20</strong></li>
          <li>En <em>Deploy</em>, selecciona <strong>Injected Provider - MetaMask</strong></li>
          <li>Despliega en este orden:
            <ol className="info-sub">
              <li><code>MockERC20("Token A", "TKA", 18)</code></li>
              <li><code>MockERC20("Token B", "TKB", 18)</code></li>
              <li><code>LoyaltyToken()</code></li>
              <li><code>LimitOrderLoyaltyHook(loyaltyTokenAddr)</code></li>
              <li>En LoyaltyToken → <code>setHook(hookAddr)</code></li>
            </ol>
          </li>
          <li>Copia cada dirección del panel <em>Deployed Contracts</em> y pégala arriba</li>
        </ol>
      </div>

      <div className="card card-dim">
        <h3 className="card-title">🌐 Red recomendada para pruebas</h3>
        <div className="network-options">
          <div className="network-opt">
            <span className="network-dot green" />
            <div>
              <strong>Remix VM (Cancun)</strong>
              <p>Sin MetaMask, sin gas real. Más rápido para pruebas rápidas</p>
            </div>
          </div>
          <div className="network-opt">
            <span className="network-dot blue" />
            <div>
              <strong>Hardhat / Anvil Local</strong>
              <p>Red local real. Usa <code>anvil --code-size-limit 30000</code></p>
            </div>
          </div>
          <div className="network-opt">
            <span className="network-dot yellow" />
            <div>
              <strong>Sepolia Testnet</strong>
              <p>Red de prueba pública. Requiere ETH de faucet Sepolia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
