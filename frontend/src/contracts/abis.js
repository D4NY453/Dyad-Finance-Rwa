// ─── ABIs de los contratos desplegados en Remix ──────────────────────────────

export const HOOK_ABI = [
  // ── Swap ──
  "function simulateSwap(address tokenIn, address tokenOut, uint256 amountIn, uint256 currentPrice) external returns (uint256 amountOut)",
  "function previewRewards(address user, uint256 amountIn) external view returns (uint256 slpAmount)",

  // ── Limit Orders ──
  "function placeLimitOrder(address tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice, uint256 minAmountOut) external returns (uint256 orderId)",
  "function cancelOrder(uint256 orderId) external",
  "function keeperExecuteOrder(uint256 orderId, uint256 currentPrice) external returns (bool executed)",
  "function getOrder(uint256 orderId) external view returns (tuple(uint256 id, address owner, address tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice, uint256 minAmountOut, uint8 status, uint256 createdAt, uint256 resolvedAt, uint256 executedAmountOut))",
  "function getUserOrderIds(address user) external view returns (uint256[])",
  "function getActiveOrdersForPair(address tokenIn, address tokenOut) external view returns (uint256[])",
  "function nextOrderId() external view returns (uint256)",

  // ── Loyalty ──
  "function claimRewards() external",
  "function getUserStats(address user) external view returns (uint256 totalVolume, uint256 swapCount, uint256 pendingRewards, uint256 claimedRewards, uint8 tier, string tierName, uint256 rewardMultiplier)",
  "function getSLPBalance(address user) external view returns (uint256)",
  "function getTierInfo() external pure returns (string[4] names, uint256[4] thresholds, uint256[4] multipliers)",
  "function loyaltyToken() external view returns (address)",

  // ── Constants ──
  "function SILVER_THRESHOLD() external view returns (uint256)",
  "function GOLD_THRESHOLD() external view returns (uint256)",
  "function PLATINUM_THRESHOLD() external view returns (uint256)",
  "function FLASH_LOAN_FEE_BPS() external view returns (uint256)",

  // ── Flash Loans ──
  "function fundPool(address token, uint256 amount) external",
  "function withdrawPool(address token, uint256 amount, address to) external",
  "function takeFlashLoan(address token, uint256 amount, bytes calldata userData) external returns (uint256 fee)",
  "function previewFlashLoanFee(uint256 amount) external pure returns (uint256 fee, uint256 repayAmount)",
  "function getFlashLoanStats(address user) external view returns (uint256 totalLoans, uint256 totalVolume, uint256 totalFeesPaid, uint256 lastLoanAt)",
  "function getPoolLiquidity(address token) external view returns (uint256)",
  "function poolLiquidity(address token) external view returns (uint256)",

  // ── Events ──
  "event SwapSimulated(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 price)",
  "event OrderPlaced(uint256 indexed orderId, address indexed owner, address tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice, uint256 minAmountOut)",
  "event OrderExecuted(uint256 indexed orderId, address indexed owner, uint256 amountOut, uint256 executedAt)",
  "event OrderCancelled(uint256 indexed orderId, address indexed owner, uint256 cancelledAt)",
  "event RewardsEarned(address indexed user, uint256 baseReward, uint256 bonusReward, uint256 totalPending, uint8 tier)",
  "event RewardsClaimed(address indexed user, uint256 amount, uint256 totalClaimed)",
  "event TierUpgraded(address indexed user, uint8 oldTier, uint8 newTier, uint256 totalVolume)",
  "event FlashLoanExecuted(address indexed currency, uint256 amount, address indexed sender)",
  "event FlashLoanCompleted(address indexed token, uint256 indexed amount, uint256 fee, address indexed borrower, uint256 completedAt)",
  "event PoolFunded(address indexed token, uint256 amount, address indexed funder)",
  "event PoolWithdrawn(address indexed token, uint256 amount, address indexed to)",
];

export const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function faucet(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export const LOYALTY_TOKEN_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address account) external view returns (uint256)",
  "function setHook(address hookAddress) external",
  "function hook() external view returns (address)",
  "function owner() external view returns (address)",
];
