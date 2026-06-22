import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { fmt } from "../hooks/useContracts";

const TOKENS = (tokenA, tokenB) => [
  { label: "TKA", address: tokenA },
  { label: "TKB", address: tokenB },
];

export default function SwapSimulator({ hook, tokenA: tokenAAddr, tokenB: tokenBAddr, account, onRefresh }) {
  const [tokenIn,  setTokenIn]  = useState("A");
  const [tokenOut, setTokenOut] = useState("B");
  const [amount,   setAmount]   = useState("1");
  const [price,    setPrice]    = useState("2000");
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");
  const [logs,     setLogs]     = useState([]);

  const tokenInAddr  = tokenIn  === "A" ? tokenAAddr : tokenBAddr;
  const tokenOutAddr = tokenOut === "A" ? tokenAAddr : tokenBAddr;

  // Preview rewards on input change
  useEffect(() => {
    if (!hook || !account || !amount || !tokenInAddr) { setPreview(null); return; }
    const fetchPreview = async () => {
      try {
        const amtWei = fmt.toWei(amount);
        const slp    = await hook.previewRewards(account, amtWei);
        setPreview(fmt.token(slp));
      } catch { setPreview(null); }
    };
    const timer = setTimeout(fetchPreview, 400);
    return () => clearTimeout(timer);
  }, [hook, account, amount, tokenInAddr]);

  const handleSwap = async () => {
    if (!hook) return;
    setError(""); setLoading(true);
    try {
      const amtWei   = fmt.toWei(amount);
      const priceWei = fmt.toPrice(price);
      const tx = await hook.simulateSwap(tokenInAddr, tokenOutAddr, amtWei, priceWei);
      const receipt = await tx.wait();
      const swapEvent = receipt.logs.find(l => {
        try { const parsed = hook.interface.parseLog(l); return parsed.name === "SwapSimulated"; }
        catch { return false; }
      });
      let amountOut = "—";
      if (swapEvent) {
        const parsed = hook.interface.parseLog(swapEvent);
        amountOut = fmt.token(parsed.args.amountOut);
      }
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("es-MX"),
        in:  `${amount} TK${tokenIn}`,
        out: `${amountOut} TK${tokenOut}`,
        price,
        hash: receipt.hash,
      };
      setLogs(prev => [newLog, ...prev.slice(0, 4)]);
      setResult({ amountOut, txHash: receipt.hash });
      onRefresh?.();
    } catch (err) {
      setError(err.reason || err.message || "Error en la transacción");
    } finally {
      setLoading(false);
    }
  };

  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const disabled = !hook || !tokenInAddr || !tokenOutAddr || tokenInAddr === tokenOutAddr || loading;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">🔄 Simulador de Swap</h2>
        <p className="panel-desc">Simula un intercambio y activa los hooks beforeSwap / afterSwap</p>
      </div>

      <div className="swap-box">
        {/* Token In */}
        <div className="swap-field">
          <label className="field-label">Token de entrada</label>
          <div className="swap-input-row">
            <select className="token-select" value={tokenIn} onChange={e => setTokenIn(e.target.value)}>
              <option value="A">🪙 Token A (TKA)</option>
              <option value="B">🪙 Token B (TKB)</option>
            </select>
            <input
              className="input input-lg"
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Flip */}
        <button className="flip-btn" onClick={flipTokens} title="Intercambiar tokens">
          ⇅
        </button>

        {/* Token Out */}
        <div className="swap-field">
          <label className="field-label">Token de salida</label>
          <div className="swap-input-row">
            <select className="token-select" value={tokenOut} onChange={e => setTokenOut(e.target.value)}>
              <option value="A">🪙 Token A (TKA)</option>
              <option value="B">🪙 Token B (TKB)</option>
            </select>
            <div className="output-display">
              {amount && price ? (parseFloat(amount) * parseFloat(price)).toLocaleString() : "0.0"}
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="swap-field">
          <label className="field-label">Precio actual de mercado <span className="field-hint">(TKout / TKin)</span></label>
          <div className="price-input-wrap">
            <input
              className="input"
              type="number"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Ej: 2000"
            />
            <span className="price-unit">TK{tokenOut}/TK{tokenIn}</span>
          </div>
        </div>

        {/* Preview rewards */}
        {preview !== null && (
          <div className="preview-badge">
            <span>✨ Ganarás aprox.</span>
            <strong>{preview} SLP</strong>
            <span>por este swap</span>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-primary btn-full" onClick={handleSwap} disabled={disabled}>
          {loading ? <><span className="spinner" /> Ejecutando swap…</> : "🔄 Simular Swap"}
        </button>
      </div>

      {/* Log de swaps recientes */}
      {logs.length > 0 && (
        <div className="recent-logs">
          <h3 className="section-title">Swaps recientes</h3>
          <div className="log-list">
            {logs.map(log => (
              <div key={log.id} className="log-item">
                <span className="log-time">{log.time}</span>
                <span className="log-tokens">{log.in} → {log.out}</span>
                <span className="log-price">@ {parseFloat(log.price).toLocaleString()}</span>
                <a
                  className="log-hash"
                  href={`https://etherscan.io/tx/${log.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  title={log.hash}
                >
                  {log.hash.slice(0, 10)}…
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
