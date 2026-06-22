// Dirección de los contratos (pega aquí las que obtengas de Remix)
// Puedes cambiarlas desde la UI en la pestaña ⚙️ Settings

export const DEFAULT_ADDRESSES = {
  hook:         "",   // LimitOrderLoyaltyHook address
  tokenA:       "",   // MockERC20 "Token A" address
  tokenB:       "",   // MockERC20 "Token B" address
  loyaltyToken: "",   // LoyaltyToken (SLP) address
};

export const TIER_CONFIG = {
  0: { name: "Bronze",   color: "#cd7f32", glow: "#cd7f3255", icon: "🥉", mult: "1.0x" },
  1: { name: "Silver",   color: "#c0c0c0", glow: "#c0c0c055", icon: "🥈", mult: "1.5x" },
  2: { name: "Gold",     color: "#ffd700", glow: "#ffd70055", icon: "🥇", mult: "2.0x" },
  3: { name: "Platinum", color: "#e5e4e2", glow: "#a8d8ea88", icon: "💎", mult: "3.0x" },
};

export const ORDER_STATUS = {
  0: { label: "Open",      color: "#06b6d4" },
  1: { label: "Executed",  color: "#10b981" },
  2: { label: "Cancelled", color: "#ef4444" },
};
