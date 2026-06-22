import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { fmt } from "../hooks/useContracts";

// Estrategias de ejemplo para el userData
const STRATEGIES = [
  { id: "noop",    label: "🔍 Solo demo (emitir evento)",     data: "0x" },
  { id: "arb",     label: "⚡ Arbitraje simulado",            data: "0x01" },
  { id: "liq",     label: "💧 Liquidación simulada",          data: "0x02" },
  { id: "refi",    label: "🔄 Refinanciación de deuda",       data: "0x03" },
  { id: "custom",  label: "✏️  Datos personalizados (hex)",   data: "" },
];

export default function FlashLoan({ hook, tokenA: tkA, tokenB: tkB, account, onRefresh }) {
  // ── Estado del pool ──
  const [liqA, setLiqA]     = useState(null);
  const [liqB, setLiqB]     = useState(null);
  const [feeBPS, setFeeBPS] = useState(5);

  // ── Fund pool ──
  const [fundToken,  setFundToken]  = useState("A");
  const [fundAmount, setFundAmount] = useState("100");
  const [funding,    setFunding]    = useState(false);
  const [fundMsg,    setFundMsg]    = useState("");

  // ── Flash Loan ──
  const [loanToken,  setLoanToken]  = useState("A");
  const [loanAmount, setLoanAmount] = useState("10");
  const [strategy,   setStrategy]   = useState("noop");
  const [customData, setCustomData] = useState("0x");
  const [preview,    setPreview]    = useState(null);
  const [loaning,    setLoaning]    = useState(false);
  const [loanMsg,    setLoanMsg]    = useState({ text: "", ok: true });

  // ── Stats ──
  const [stats,      setStats]      = useState(null);

  // ── Log de eventos ──
  const [eventLog, setEventLog]     = useState([]);

  const addrOf = (tok) => tok === "A" ? tkA : tkB;
  const labelOf = (addr) => addr === tkA ? "TKA" : addr === tkB ? "TKB" : fmt.addr(addr);
  const tokenContract = (tok) => {
    // Necesitamos el contrato ERC20 para approve - lo construimos desde el hook
    return null; // se resuelve en los handlers con transferencia directa
  };

  // ── Cargar datos ──
  const loadData = useCallback(async () => {
    if (!hook || !tkA || !tkB) return;
    try {
      const [la, lb, bps] = await Promise.all([
        hook.getPoolLiquidity(tkA).catch(() => 0n),
        hook.getPoolLiquidity(tkB).catch(() => 0n),
        hook.FLASH_LOAN_FEE_BPS().catch(() => 5n),
      ]);
      setLiqA(la); setLiqB(lb);
      setFeeBPS(Number(bps));
      if (account) {
        const s = await hook.getFlashLoanStats(account);
        setStats(s);
      }
    } catch (e) { console.error(e); }
  }, [hook, tkA, tkB, account]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Preview fee ──
  useEffect(() => {
    if (!hook || !loanAmount || parseFloat(loanAmount) <= 0) { setPreview(null); return; }
    const calc = async () => {
      try {
        const amtWei = fmt.toWei(loanAmount);
        const [fee, repay] = await hook.previewFlashLoanFee(amtWei);
        setPreview({ fee: fmt.token(fee), repay: fmt.token(repay) });
      } catch { setPreview(null); }
    };
    const t = setTimeout(calc, 300);
    return () => clearTimeout(t);
  }, [hook, loanAmount]);

  // ── Suscribir a eventos ──
  useEffect(() => {
    if (!hook) return;
    const onExecuted = (currency, amount, sender, event) => {
      addLog("⚡ FlashLoanExecuted", `${fmt.token(amount)} tokens | ${fmt.addr(sender)}`,"cyan");
    };
    const onCompleted = (token, amount, fee, borrower, at, event) => {
      addLog("✅ FlashLoanCompleted", `${fmt.token(amount)} prestados · fee: ${fmt.token(fee)} · borrower: ${fmt.addr(borrower)}`, "green");
    };
    const onFunded = (token, amount, funder, event) => {
      addLog("💰 PoolFunded", `+${fmt.token(amount)} tokens en el pool por ${fmt.addr(funder)}`, "purple");
    };

    hook.on("FlashLoanExecuted", onExecuted);
    hook.on("FlashLoanCompleted", onCompleted);
    hook.on("PoolFunded", onFunded);

    return () => {
      hook.off("FlashLoanExecuted", onExecuted);
      hook.off("FlashLoanCompleted", onCompleted);
      hook.off("PoolFunded", onFunded);
    };
  }, [hook]);

  const addLog = (event, detail, color = "white") => {
    setEventLog(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString("es-MX"),
      event, detail, color,
    }, ...prev.slice(0, 9)]);
  };

  // ── Fund pool handler ──
  const handleFund = async () => {
    if (!hook) return;
    setFunding(true); setFundMsg("");
    const token = addrOf(fundToken);
    try {
      const amtWei = fmt.toWei(fundAmount);

      // Paso 1: approve
      const { ethers: eth } = await import("ethers");
      const erc20 = new eth.Contract(token, [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
      ], hook.runner);

      const allowance = await erc20.allowance(account, await hook.getAddress());
      if (allowance < amtWei) {
        setFundMsg("🔑 Aprobando tokens…");
        const approveTx = await erc20.approve(await hook.getAddress(), amtWei * 2n);
        await approveTx.wait();
      }

      // Paso 2: fundPool
      setFundMsg("⏳ Fondeando pool…");
      const tx = await hook.fundPool(token, amtWei);
      await tx.wait();
      setFundMsg(`✅ Pool fondeado con ${fundAmount} TK${fundToken}`);
      await loadData();
      addLog("💰 Pool fondeado", `+${fundAmount} TK${fundToken}`, "purple");
      onRefresh?.();
    } catch (err) {
      setFundMsg("❌ " + (err.reason || err.message || "Error"));
    } finally {
      setFunding(false);
    }
  };

  // ── Flash Loan handler ──
  const handleFlashLoan = async () => {
    if (!hook) return;
    setLoaning(true); setLoanMsg({ text: "", ok: true });
    const token = addrOf(loanToken);
    try {
      const amtWei = fmt.toWei(loanAmount);
      const [fee] = await hook.previewFlashLoanFee(amtWei);
      const repayAmt = amtWei + fee;

      // Paso 1: approve del repago
      const { ethers: eth } = await import("ethers");
      const erc20 = new eth.Contract(token, [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address) external view returns (uint256)",
      ], hook.runner);

      const hookAddr = await hook.getAddress();

      // Verificar balance para repago
      const balance = await erc20.balanceOf(account);
      if (balance < repayAmt) {
        setLoanMsg({ text: `❌ Necesitas al menos ${fmt.token(repayAmt)} TK${loanToken} en tu wallet para pagar el fee (${fmt.token(fee)})`, ok: false });
        setLoaning(false);
        return;
      }

      const allowance = await erc20.allowance(account, hookAddr);
      if (allowance < repayAmt) {
        setLoanMsg({ text: "🔑 Aprobando repago…", ok: true });
        const approveTx = await erc20.approve(hookAddr, repayAmt * 2n);
        await approveTx.wait();
      }

      // Paso 2: tomar el flash loan
      const strat = STRATEGIES.find(s => s.id === strategy);
      const userData = strategy === "custom"
        ? (customData.startsWith("0x") ? customData : "0x" + customData)
        : strat.data;

      setLoanMsg({ text: "⚡ Ejecutando flash loan…", ok: true });
      const tx = await hook.takeFlashLoan(token, amtWei, userData);
      const receipt = await tx.wait();

      setLoanMsg({
        text: `✅ Flash loan completado · ${loanAmount} TK${loanToken} prestados · fee: ${fmt.token(fee)} TK${loanToken}`,
        ok: true,
      });
      addLog("⚡ Flash loan", `${loanAmount} TK${loanToken} · estrategia: ${strat?.label}`, "cyan");
      await loadData();
      onRefresh?.();
    } catch (err) {
      const msg = err.reason || err.message || "Error desconocido";
      setLoanMsg({ text: "❌ " + msg, ok: false });
      addLog("❌ Error", msg, "red");
    } finally {
      setLoaning(false);
    }
  };

  const liqToken = loanToken === "A" ? liqA : liqB;
  const disabled = !hook || !tkA || !tkB;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">⚡ Flash Loans</h2>
        <p className="panel-desc">
          Pide tokens prestados, ejecuta lógica personalizada y repaga en la misma transacción.
          Implementa <code className="inline-code">_executeFlashLoanLogic</code> para arbitraje, liquidaciones y más.
        </p>
      </div>

      {/* ── Diagrama de flujo ── */}
      <div className="card flash-diagram">
        <div className="flow-steps">
          {[
            { n:"1", icon:"🏦", label:"Hook presta tokens" },
            { n:"2", icon:"⚙️",  label:"_executeFlashLoanLogic" },
            { n:"3", icon:"📤", label:"Repago + fee (0.05%)" },
            { n:"4", icon:"✅", label:"FlashLoanCompleted" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div className="flow-step">
                <div className="flow-num">{s.n}</div>
                <div className="flow-icon">{s.icon}</div>
                <div className="flow-label">{s.label}</div>
              </div>
              {i < arr.length - 1 && <div className="flow-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Liquidez del pool ── */}
      <div className="card">
        <h3 className="card-title">💧 Liquidez del Pool</h3>
        <div className="liquidity-grid">
          <div className="liq-item">
            <span className="liq-token">🪙 Token A (TKA)</span>
            <span className="liq-amount">{liqA !== null ? fmt.token(liqA) : "—"}</span>
            <span className="liq-label">disponibles</span>
          </div>
          <div className="liq-item">
            <span className="liq-token">🪙 Token B (TKB)</span>
            <span className="liq-amount">{liqB !== null ? fmt.token(liqB) : "—"}</span>
            <span className="liq-label">disponibles</span>
          </div>
          <div className="liq-item liq-fee">
            <span className="liq-token">📊 Fee protocolo</span>
            <span className="liq-amount" style={{color:"#f59e0b"}}>{feeBPS / 100}%</span>
            <span className="liq-label">{feeBPS} bps</span>
          </div>
        </div>
      </div>

      {/* ── Fondear pool ── */}
      <div className="card">
        <h3 className="card-title">💰 Fondear Pool de Liquidez</h3>
        <p className="card-desc-sm">Deposita tokens para que otros puedan pedir flash loans</p>
        <div className="form-row-3">
          <div className="form-field">
            <label className="field-label">Token</label>
            <select className="token-select w-full" value={fundToken}
              onChange={e => setFundToken(e.target.value)}>
              <option value="A">🪙 TKA</option>
              <option value="B">🪙 TKB</option>
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Cantidad</label>
            <input className="input" type="number" value={fundAmount}
              onChange={e => setFundAmount(e.target.value)} placeholder="100" />
          </div>
          <div className="form-field form-field-action">
            <label className="field-label">&nbsp;</label>
            <button className="btn btn-accent btn-full" onClick={handleFund}
              disabled={disabled || funding}>
              {funding ? <><span className="spinner" /> Fondeando…</> : "💰 Fondear Pool"}
            </button>
          </div>
        </div>
        {fundMsg && (
          <div className={`alert ${fundMsg.startsWith("✅") ? "alert-success" : fundMsg.startsWith("❌") ? "alert-error" : "alert-info"}`}>
            {fundMsg}
          </div>
        )}
        <div className="fund-hint">
          <strong>Pasos automáticos:</strong> approve tokens → fundPool(token, amount)
        </div>
      </div>

      {/* ── Ejecutar Flash Loan ── */}
      <div className="card flash-card">
        <h3 className="card-title">⚡ Ejecutar Flash Loan</h3>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Token a pedir prestado</label>
            <select className="token-select w-full" value={loanToken}
              onChange={e => setLoanToken(e.target.value)}>
              <option value="A">🪙 Token A (TKA)</option>
              <option value="B">🪙 Token B (TKB)</option>
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">
              Cantidad <span className="field-hint">(disponible: {liqToken !== null ? fmt.token(liqToken) : "—"})</span>
            </label>
            <input className="input" type="number" value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)} placeholder="10" />
          </div>
        </div>

        <div className="form-field mb-14">
          <label className="field-label">Estrategia / Lógica <span className="field-hint">(userData pasado a _executeFlashLoanLogic)</span></label>
          <select className="token-select w-full" value={strategy}
            onChange={e => setStrategy(e.target.value)}>
            {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {strategy === "custom" && (
          <div className="form-field mb-14">
            <label className="field-label">Datos hexadecimales (userData)</label>
            <input className="input input-mono" value={customData}
              onChange={e => setCustomData(e.target.value)} placeholder="0x..." />
          </div>
        )}

        {/* Preview de fee */}
        {preview && (
          <div className="flash-preview">
            <div className="flash-preview-row">
              <span>Cantidad prestada</span>
              <strong>{loanAmount} TK{loanToken}</strong>
            </div>
            <div className="flash-preview-row">
              <span>Fee (0.05%)</span>
              <strong className="fee-val">{preview.fee} TK{loanToken}</strong>
            </div>
            <div className="flash-preview-row total-row">
              <span>Total a repagar</span>
              <strong className="repay-val">{preview.repay} TK{loanToken}</strong>
            </div>
          </div>
        )}

        <div className="flash-warning">
          ⚠️ Necesitas <strong>{preview?.repay ?? "—"} TK{loanToken}</strong> en tu wallet para el repago del fee.
          El préstamo se devuelve automáticamente en la misma transacción.
        </div>

        {loanMsg.text && (
          <div className={`alert ${loanMsg.ok ? (loanMsg.text.startsWith("✅") ? "alert-success" : "alert-info") : "alert-error"}`}>
            {loanMsg.text}
          </div>
        )}

        <button className="btn btn-primary btn-full flash-btn" onClick={handleFlashLoan}
          disabled={disabled || loaning}>
          {loaning
            ? <><span className="spinner" /> Ejecutando…</>
            : "⚡ Ejecutar Flash Loan"
          }
        </button>

        <div className="fund-hint">
          <strong>Pasos automáticos:</strong> approve repago → takeFlashLoan → _executeFlashLoanLogic → repago automático
        </div>
      </div>

      {/* ── Stats del usuario ── */}
      {stats && (
        <div className="card">
          <h3 className="card-title">📊 Tus Flash Loan Stats</h3>
          <div className="fl-stats-grid">
            <div className="fl-stat">
              <span className="fl-stat-val">{stats.totalLoans?.toString() ?? "0"}</span>
              <span className="fl-stat-lbl">Loans totales</span>
            </div>
            <div className="fl-stat">
              <span className="fl-stat-val">{fmt.token(stats.totalVolume ?? 0n)}</span>
              <span className="fl-stat-lbl">Volumen prestado</span>
            </div>
            <div className="fl-stat">
              <span className="fl-stat-val" style={{color:"#f59e0b"}}>{fmt.token(stats.totalFeesPaid ?? 0n)}</span>
              <span className="fl-stat-lbl">Fees pagados</span>
            </div>
            <div className="fl-stat">
              <span className="fl-stat-val" style={{color:"#7b8199", fontSize:"14px"}}>
                {stats.lastLoanAt && Number(stats.lastLoanAt) > 0 ? fmt.date(stats.lastLoanAt) : "—"}
              </span>
              <span className="fl-stat-lbl">Último loan</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Código de referencia ── */}
      <div className="card card-dim">
        <h3 className="card-title">💻 Override: _executeFlashLoanLogic</h3>
        <p className="card-desc-sm">
          Para implementar lógica personalizada, crea un contrato que herede del hook y sobreescribe esta función:
        </p>
        <pre className="code-block">{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LimitOrderLoyaltyHook.sol";

contract MiHookConArbitraje is LimitOrderLoyaltyHook {
    constructor(address loyaltyToken)
        LimitOrderLoyaltyHook(loyaltyToken) {}

    function _executeFlashLoanLogic(
        Currency currency,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        // Los tokens ya están en address(this) o msg.sender
        // Aquí va tu lógica de arbitraje, liquidación, etc.

        // Ejemplo: decodificar parámetros de arbitraje
        // (address poolA, address poolB, uint256 minProfit) =
        //     abi.decode(data, (address, address, uint256));

        // Emitir el evento base (requerido)
        emit FlashLoanExecuted(currency, amount, msg.sender);
    }
}`}</pre>
      </div>

      {/* ── Log de eventos en tiempo real ── */}
      {eventLog.length > 0 && (
        <div className="card">
          <h3 className="card-title">📡 Eventos en tiempo real</h3>
          <div className="event-log">
            {eventLog.map(log => (
              <div key={log.id} className="event-item">
                <span className="event-time">{log.time}</span>
                <span className="event-name" style={{color: {cyan:"#06b6d4",green:"#10b981",purple:"#a855f7",red:"#ef4444"}[log.color] ?? "#fff"}}>
                  {log.event}
                </span>
                <span className="event-detail">{log.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
