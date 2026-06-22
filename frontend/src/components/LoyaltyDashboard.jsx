import React, { useState, useEffect, useCallback } from "react";
import { fmt } from "../hooks/useContracts";
import { TIER_CONFIG } from "../contracts/addresses";

export default function LoyaltyDashboard({ hook, account, onRefresh }) {
  const [stats,    setStats]    = useState(null);
  const [slpBal,   setSLPBal]   = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const [loading,  setLoading]  = useState(false);

  const THRESHOLDS = [0n, BigInt("1000000000000000000"), BigInt("10000000000000000000"), BigInt("100000000000000000000")];

  const loadStats = useCallback(async () => {
    if (!hook || !account) return;
    setLoading(true);
    try {
      const [s, bal] = await Promise.all([
        hook.getUserStats(account),
        hook.getSLPBalance(account),
      ]);
      setStats(s);
      setSLPBal(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hook, account]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleClaim = async () => {
    if (!hook) return;
    setClaiming(true); setClaimMsg("");
    try {
      const tx = await hook.claimRewards();
      await tx.wait();
      setClaimMsg("✅ Rewards reclamados exitosamente!");
      await loadStats();
      onRefresh?.();
    } catch (err) {
      setClaimMsg("❌ " + (err.reason || err.message || "Error al reclamar"));
    } finally {
      setClaiming(false);
    }
  };

  // Calcular progreso al siguiente tier
  const tierProgress = () => {
    if (!stats) return { pct: 0, next: "—", remaining: "—" };
    const vol = stats.totalVolume;
    const tier = Number(stats.tier);
    if (tier >= 3) return { pct: 100, next: "MAX", remaining: "0" };
    const curr = THRESHOLDS[tier];
    const next  = THRESHOLDS[tier + 1];
    const range = next - curr;
    const done  = vol > curr ? vol - curr : 0n;
    const pct   = Math.min(100, Number((done * 100n) / range));
    const left  = next - vol > 0n ? next - vol : 0n;
    return {
      pct,
      next: TIER_CONFIG[tier + 1]?.name,
      remaining: fmt.token(left),
    };
  };

  const progress = tierProgress();
  const tierCfg  = stats ? TIER_CONFIG[Number(stats.tier)] : TIER_CONFIG[0];
  const hasPending = stats && stats.pendingRewards > 0n;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">🏆 Loyalty Rewards</h2>
        <p className="panel-desc">Gana tokens SLP por cada swap. Sube de tier para mejores multiplicadores</p>
      </div>

      {loading && !stats && (
        <div className="loading-state"><span className="spinner-lg" /> Cargando estadísticas…</div>
      )}

      {stats && (
        <>
          {/* ── Tier Card ── */}
          <div className="tier-card" style={{
            "--tier-color": tierCfg.color,
            "--tier-glow":  tierCfg.glow,
            boxShadow: `0 0 40px ${tierCfg.glow}, 0 0 80px ${tierCfg.glow}40`,
            borderColor: `${tierCfg.color}40`,
          }}>
            <div className="tier-top">
              <span className="tier-icon">{tierCfg.icon}</span>
              <div>
                <div className="tier-name" style={{ color: tierCfg.color }}>{tierCfg.name}</div>
                <div className="tier-mult">Multiplicador: <strong>{tierCfg.mult}</strong></div>
              </div>
              <div className="tier-stats-mini">
                <div className="stat-mini">
                  <span className="stat-val">{stats.swapCount.toString()}</span>
                  <span className="stat-lbl">Swaps</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-val">{fmt.token(stats.totalVolume, 18, 2)}</span>
                  <span className="stat-lbl">ETH Vol.</span>
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            {progress.pct < 100 && (
              <div className="tier-progress-wrap">
                <div className="tier-progress-labels">
                  <span>{tierCfg.name}</span>
                  <span>{progress.next}</span>
                </div>
                <div className="tier-progress-bar">
                  <div
                    className="tier-progress-fill"
                    style={{ width: `${progress.pct}%`, background: `linear-gradient(90deg, ${tierCfg.color}, ${TIER_CONFIG[Number(stats.tier)+1]?.color || tierCfg.color})` }}
                  />
                </div>
                <div className="tier-progress-hint">
                  Faltan <strong>{progress.remaining} ETH</strong> en volumen para subir a {progress.next}
                </div>
              </div>
            )}
            {progress.pct >= 100 && (
              <div className="tier-max">💎 ¡Nivel máximo alcanzado! Disfrutas del 3x de rewards</div>
            )}
          </div>

          {/* ── Rewards Cards ── */}
          <div className="rewards-grid">
            <div className="card rewards-card">
              <div className="rewards-label">⏳ Pendientes de reclamar</div>
              <div className="rewards-amount slp-pending">{fmt.token(stats.pendingRewards)} SLP</div>
              {claimMsg && (
                <div className={`alert ${claimMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}>
                  {claimMsg}
                </div>
              )}
              <button
                className="btn btn-primary btn-full"
                onClick={handleClaim}
                disabled={!hasPending || claiming}
              >
                {claiming
                  ? <><span className="spinner" /> Reclamando…</>
                  : hasPending ? "🎁 Reclamar SLP" : "Sin rewards pendientes"
                }
              </button>
            </div>

            <div className="card rewards-card">
              <div className="rewards-label">✅ SLP en tu wallet</div>
              <div className="rewards-amount slp-balance">{fmt.token(slpBal ?? 0n)} SLP</div>
              <div className="rewards-label mt-auto">🏅 Total reclamado</div>
              <div className="rewards-sub">{fmt.token(stats.claimedRewards)} SLP</div>
            </div>
          </div>

          {/* ── Tabla de tiers ── */}
          <div className="card">
            <h3 className="card-title">📊 Sistema de Tiers</h3>
            <div className="tiers-table">
              {Object.entries(TIER_CONFIG).map(([tierIdx, cfg]) => {
                const isCurrent = Number(stats.tier) === Number(tierIdx);
                const threshold = THRESHOLDS[tierIdx];
                return (
                  <div key={tierIdx} className={`tier-row ${isCurrent ? "tier-row-active" : ""}`}
                    style={isCurrent ? { borderColor: cfg.color, background: `${cfg.glow}22` } : {}}>
                    <span className="tier-row-icon">{cfg.icon}</span>
                    <div className="tier-row-info">
                      <span className="tier-row-name" style={isCurrent ? { color: cfg.color } : {}}>
                        {cfg.name} {isCurrent && <span className="current-badge">← actual</span>}
                      </span>
                      <span className="tier-row-req">
                        {Number(tierIdx) === 0 ? "Sin requisito" : `≥ ${fmt.token(threshold)} ETH en volumen`}
                      </span>
                    </div>
                    <div className="tier-row-mult" style={{ color: cfg.color }}>{cfg.mult}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!account && (
        <div className="empty-state">Conecta tu wallet para ver tus rewards</div>
      )}
    </div>
  );
}
