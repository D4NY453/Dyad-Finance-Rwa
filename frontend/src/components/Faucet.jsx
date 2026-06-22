import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { fmt } from "../hooks/useContracts";

export default function Faucet({ tokenA, tokenB, account, tokenAAddr, tokenBAddr }) {
  const [balA, setBalA] = useState(null);
  const [balB, setBalB] = useState(null);
  const [loading, setLoading] = useState({ A: false, B: false });
  const [msgs,    setMsgs]    = useState({ A: "", B: "" });

  const loadBalances = useCallback(async () => {
    if (!tokenA || !tokenB || !account) return;
    try {
      const [a, b] = await Promise.all([tokenA.balanceOf(account), tokenB.balanceOf(account)]);
      setBalA(a); setBalB(b);
    } catch(e) { console.error(e); }
  }, [tokenA, tokenB, account]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const faucet = async (token, key, amount) => {
    if (!token || !account) return;
    setLoading(l => ({ ...l, [key]: true }));
    setMsgs(m => ({ ...m, [key]: "" }));
    try {
      const amtWei = ethers.parseEther(amount);
      const tx = await token.faucet(account, amtWei);
      await tx.wait();
      setMsgs(m => ({ ...m, [key]: `✅ +${amount} tokens recibidos` }));
      await loadBalances();
    } catch (err) {
      setMsgs(m => ({ ...m, [key]: "❌ " + (err.reason || err.message) }));
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  const TokenCard = ({ tok, key_, label, balance, addr }) => (
    <div className="card faucet-card">
      <div className="faucet-header">
        <span className="faucet-icon">🪙</span>
        <div>
          <div className="faucet-label">{label}</div>
          <div className="faucet-addr">{fmt.addr(addr)}</div>
        </div>
        <div className="faucet-balance">
          <div className="bal-amount">{balance !== null ? fmt.token(balance) : "—"}</div>
          <div className="bal-label">Balance</div>
        </div>
      </div>
      <div className="faucet-btns">
        {["100", "1000", "10000"].map(amt => (
          <button key={amt} className="btn btn-outline btn-sm"
            onClick={() => faucet(tok, key_, amt)}
            disabled={loading[key_] || !tok}>
            +{amt}
          </button>
        ))}
      </div>
      {msgs[key_] && (
        <div className={`alert ${msgs[key_].startsWith("✅") ? "alert-success" : "alert-error"}`}>
          {msgs[key_]}
        </div>
      )}
    </div>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">🚰 Faucet de Tokens</h2>
        <p className="panel-desc">Obtén tokens de prueba gratis para testear la DApp</p>
      </div>

      <div className="faucet-grid">
        <TokenCard tok={tokenA} key_="A" label="Token A (TKA)" balance={balA} addr={tokenAAddr} />
        <TokenCard tok={tokenB} key_="B" label="Token B (TKB)" balance={balB} addr={tokenBAddr} />
      </div>

      <div className="card card-dim">
        <h3 className="card-title">ℹ️ Cómo usar los tokens</h3>
        <ol className="info-list">
          <li>Usa el Faucet para obtener TKA y TKB de prueba</li>
          <li>Ve a <strong>Swap Simulator</strong> → simula intercambios para acumular rewards</li>
          <li>Ve a <strong>Órdenes Límite</strong> → coloca una orden con precio objetivo menor al actual</li>
          <li>Simula un swap al precio objetivo → la orden se ejecuta automáticamente</li>
          <li>Ve a <strong>Loyalty Rewards</strong> → reclama tus tokens SLP ganados</li>
        </ol>
      </div>
    </div>
  );
}
