import { useMemo } from "react";
import { ethers } from "ethers";
import { HOOK_ABI, ERC20_ABI, LOYALTY_TOKEN_ABI } from "../contracts/abis";

export function useContracts(signer, addresses) {
  const hook = useMemo(() => {
    if (!signer || !addresses.hook) return null;
    try { return new ethers.Contract(addresses.hook, HOOK_ABI, signer); }
    catch { return null; }
  }, [signer, addresses.hook]);

  const tokenA = useMemo(() => {
    if (!signer || !addresses.tokenA) return null;
    try { return new ethers.Contract(addresses.tokenA, ERC20_ABI, signer); }
    catch { return null; }
  }, [signer, addresses.tokenA]);

  const tokenB = useMemo(() => {
    if (!signer || !addresses.tokenB) return null;
    try { return new ethers.Contract(addresses.tokenB, ERC20_ABI, signer); }
    catch { return null; }
  }, [signer, addresses.tokenB]);

  const loyaltyToken = useMemo(() => {
    if (!signer || !addresses.loyaltyToken) return null;
    try { return new ethers.Contract(addresses.loyaltyToken, LOYALTY_TOKEN_ABI, signer); }
    catch { return null; }
  }, [signer, addresses.loyaltyToken]);

  return { hook, tokenA, tokenB, loyaltyToken };
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

export const fmt = {
  /** BigInt → legible (ej: 1.5 ETH) */
  token: (val, decimals = 18, digits = 4) => {
    if (!val && val !== 0n) return "—";
    try {
      const num = Number(ethers.formatUnits(val.toString(), decimals));
      return num.toLocaleString("en-US", { maximumFractionDigits: digits });
    } catch { return "—"; }
  },

  /** wei string → BigInt con 18 decimales */
  toWei: (val) => {
    try { return ethers.parseEther(val.toString()); }
    catch { return 0n; }
  },

  /** number → BigInt escalado a 1e18 (para precios) */
  toPrice: (val) => {
    try { return ethers.parseUnits(val.toString(), 18); }
    catch { return 0n; }
  },

  /** timestamp Unix → fecha legible */
  date: (ts) => {
    if (!ts || ts === 0n || ts === 0) return "—";
    return new Date(Number(ts) * 1000).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  },

  /** Acortar dirección */
  addr: (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—",
};
