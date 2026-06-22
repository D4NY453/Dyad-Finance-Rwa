import React, { useState, useEffect, useCallback } from "react";
import { fmt } from "../hooks/useContracts";
import { ORDER_STATUS } from "../contracts/addresses";

export default function LimitOrders({ hook, tokenAAddr, tokenBAddr, account, onRefresh }) {
  // ── Formulario ──
  const [form, setForm] = useState({
    tokenIn:      "A",
    tokenOut:     "B",
    amountIn:     "0.5",
    targetPrice:  "1800",
    minAmountOut: "0",
  });
  const [placing, setPlacing]     = useState(false);
  const [placeError, setPlaceErr] = useState("");

  // ── Lista de órdenes ──
  const [orders, setOrders]       = useState([]);
  const [loadingOrders, setLO]    = useState(false);

  // ── Keeper form ──
  const [keeperId, setKeeperId]   = useState("");
  const [keeperPrice, setKP]      = useState("");
  const [keeperLoading, setKL]    = useState(false);
  const [keeperMsg, setKM]        = useState("");

  const addrOf = (tok) => tok === "A" ? tokenAAddr : tokenBAddr;
  const labelOf = (addr) => addr === tokenAAddr ? "TKA" : addr === tokenBAddr ? "TKB" : fmt.addr(addr);

  // ── Cargar órdenes ──
  const loadOrders = useCallback(async () => {
    if (!hook || !account) return;
    setLO(true);
    try {
      const ids = await hook.getUserOrderIds(account);
      const details = await Promise.all(
        ids.map(id => hook.getOrder(id).catch(() => null))
      );
      setOrders(details.filter(Boolean).reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setLO(false);
    }
  }, [hook, account]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Colocar orden ──
  const handlePlace = async () => {
    if (!hook) return;
    setPlaceErr(""); setPlacing(true);
    try {
      const tokenInAddr  = addrOf(form.tokenIn);
      const tokenOutAddr = addrOf(form.tokenOut);
      const amtWei       = fmt.toWei(form.amountIn);
      const priceWei     = fmt.toPrice(form.targetPrice);
      const minOut       = form.minAmountOut && parseFloat(form.minAmountOut) > 0
        ? fmt.toPrice(form.minAmountOut)
        : 0n;

      const tx = await hook.placeLimitOrder(tokenInAddr, tokenOutAddr, amtWei, priceWei, minOut);
      await tx.wait();
      await loadOrders();
      onRefresh?.();
      setForm(f => ({ ...f, amountIn: "0.5", targetPrice: "1800", minAmountOut: "0" }));
    } catch (err) {
      setPlaceErr(err.reason || err.message || "Error al colocar orden");
    } finally {
      setPlacing(false);
    }
  };

  // ── Cancelar orden ──
  const handleCancel = async (orderId) => {
    if (!hook) return;
    try {
      const tx = await hook.cancelOrder(orderId);
      await tx.wait();
      await loadOrders();
      onRefresh?.();
    } catch (err) {
      alert(err.reason || err.message);
    }
  };

  // ── Keeper: ejecutar manualmente ──
  const handleKeeper = async () => {
    if (!hook || !keeperId || !keeperPrice) return;
    setKL(true); setKM("");
    try {
      const priceWei = fmt.toPrice(keeperPrice);
      const tx = await hook.keeperExecuteOrder(BigInt(keeperId), priceWei);
      await tx.wait();
      setKM("✅ Orden ejecutada correctamente");
      await loadOrders();
      onRefresh?.();
    } catch (err) {
      setKM("❌ " + (err.reason || err.message || "Error"));
    } finally {
      setKL(false);
    }
  };

  const openOrders   = orders.filter(o => o.status === 0n || Number(o.status) === 0);
  const closedOrders = orders.filter(o => o.status !== 0n && Number(o.status) !== 0);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">📋 Órdenes Límite</h2>
        <p className="panel-desc">Coloca órdenes que se ejecutan automáticamente en beforeSwap</p>
      </div>

      {/* ── Formulario nueva orden ── */}
      <div className="card">
        <h3 className="card-title">➕ Nueva orden límite</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Vender</label>
            <select className="token-select w-full" value={form.tokenIn}
              onChange={e => setForm(f => ({ ...f, tokenIn: e.target.value }))}>
              <option value="A">🪙 Token A (TKA)</option>
              <option value="B">🪙 Token B (TKB)</option>
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Para recibir</label>
            <select className="token-select w-full" value={form.tokenOut}
              onChange={e => setForm(f => ({ ...f, tokenOut: e.target.value }))}>
              <option value="A">🪙 Token A (TKA)</option>
              <option value="B">🪙 Token B (TKB)</option>
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Cantidad a vender</label>
            <input className="input" type="number" value={form.amountIn} placeholder="0.5"
              onChange={e => setForm(f => ({ ...f, amountIn: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="field-label">Precio objetivo <span className="field-hint">(ejecución cuando ≤ esto)</span></label>
            <input className="input" type="number" value={form.targetPrice} placeholder="1800"
              onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="field-label">Mínimo a recibir <span className="field-hint">(0 = sin límite)</span></label>
            <input className="input" type="number" value={form.minAmountOut} placeholder="0"
              onChange={e => setForm(f => ({ ...f, minAmountOut: e.target.value }))} />
          </div>
        </div>

        {form.amountIn && form.targetPrice && (
          <div className="order-preview">
            Vender <strong>{form.amountIn} TK{form.tokenIn}</strong> cuando el precio llegue a{" "}
            <strong>{parseFloat(form.targetPrice).toLocaleString()} TK{form.tokenOut}/TK{form.tokenIn}</strong>
            {" "}→ recibirás ~<strong>{(parseFloat(form.amountIn) * parseFloat(form.targetPrice)).toLocaleString()} TK{form.tokenOut}</strong>
          </div>
        )}

        {placeError && <div className="alert alert-error">{placeError}</div>}

        <button className="btn btn-accent btn-full" onClick={handlePlace}
          disabled={!hook || placing || addrOf(form.tokenIn) === addrOf(form.tokenOut)}>
          {placing ? <><span className="spinner" /> Colocando orden…</> : "📋 Colocar Orden Límite"}
        </button>
      </div>

      {/* ── Keeper manual ── */}
      <div className="card card-dim">
        <h3 className="card-title">🔧 Ejecución manual (Keeper)</h3>
        <div className="keeper-row">
          <input className="input" type="number" placeholder="ID de orden" value={keeperId}
            onChange={e => setKeeperId(e.target.value)} />
          <input className="input" type="number" placeholder="Precio actual" value={keeperPrice}
            onChange={e => setKP(e.target.value)} />
          <button className="btn btn-outline" onClick={handleKeeper} disabled={keeperLoading || !hook}>
            {keeperLoading ? <span className="spinner" /> : "▶ Ejecutar"}
          </button>
        </div>
        {keeperMsg && <div className={`alert ${keeperMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}>{keeperMsg}</div>}
      </div>

      {/* ── Tabla: órdenes abiertas ── */}
      <div className="card">
        <div className="card-header-row">
          <h3 className="card-title">🟢 Órdenes Abiertas ({openOrders.length})</h3>
          <button className="btn btn-sm btn-outline" onClick={loadOrders} disabled={loadingOrders}>
            {loadingOrders ? <span className="spinner-sm" /> : "↻"} Actualizar
          </button>
        </div>

        {openOrders.length === 0
          ? <p className="empty-state">No tienes órdenes abiertas</p>
          : (
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Par</th><th>Cantidad</th>
                    <th>Precio objetivo</th><th>Creada</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map(o => (
                    <tr key={o.id.toString()}>
                      <td><span className="order-id">#{o.id.toString()}</span></td>
                      <td>
                        <span className="pair-badge">
                          {labelOf(o.tokenIn)} → {labelOf(o.tokenOut)}
                        </span>
                      </td>
                      <td>{fmt.token(o.amountIn)}</td>
                      <td>{fmt.token(o.targetPrice)}</td>
                      <td className="text-dim">{fmt.date(o.createdAt)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger"
                          onClick={() => handleCancel(o.id)}>
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* ── Historial ── */}
      {closedOrders.length > 0 && (
        <div className="card card-dim">
          <h3 className="card-title">📜 Historial</h3>
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr><th>ID</th><th>Par</th><th>Estado</th><th>Recibido</th><th>Resuelta</th></tr>
              </thead>
              <tbody>
                {closedOrders.map(o => {
                  const st = ORDER_STATUS[Number(o.status)] ?? { label: "?", color: "#888" };
                  return (
                    <tr key={o.id.toString()}>
                      <td><span className="order-id">#{o.id.toString()}</span></td>
                      <td><span className="pair-badge">{labelOf(o.tokenIn)} → {labelOf(o.tokenOut)}</span></td>
                      <td><span className="status-badge" style={{ color: st.color }}>{st.label}</span></td>
                      <td>{Number(o.status) === 1 ? fmt.token(o.executedAmountOut) : "—"}</td>
                      <td className="text-dim">{fmt.date(o.resolvedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
