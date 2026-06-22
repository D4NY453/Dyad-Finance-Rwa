// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LoyaltyToken.sol";

// ──────────────────────────────────────────────────────────────────────────────
// CURRENCY TYPE  (igual que @uniswap/v4-core/contracts/types/Currency.sol)
// Representa un token: address(0) = ETH nativo, cualquier otra = ERC-20
// ──────────────────────────────────────────────────────────────────────────────
type Currency is address;

library CurrencyLibrary {
    /// @dev ETH nativo
    Currency public constant NATIVE = Currency.wrap(address(0));

    function unwrap(Currency c) internal pure returns (address) {
        return Currency.unwrap(c);
    }

    function isNative(Currency c) internal pure returns (bool) {
        return Currency.unwrap(c) == address(0);
    }

    function toId(Currency c) internal pure returns (uint256) {
        return uint256(uint160(Currency.unwrap(c)));
    }
}

/**
 * @title LimitOrderLoyaltyHook
 * @author Basado en Uniswap v4-template (saucepoint)
 *
 * @notice Contrato Hook de Uniswap v4 que combina:
 *
 *   📋 LIMIT ORDERS  ─ Permite colocar órdenes límite que se ejecutan
 *                      automáticamente cuando el precio objetivo es alcanzado
 *                      durante un swap (en beforeSwap).
 *
 *   🏆 LOYALTY REWARDS ─ Cada swap acumula tokens SLP proporcionales al
 *                         volumen. Los multiplicadores aumentan con el tier.
 *
 * ════════════════════════════════════════════════════════════════
 *  GUÍA DE USO EN REMIX
 * ════════════════════════════════════════════════════════════════
 *
 *  PASO 1 — Desplegar contratos auxiliares
 *    a) MockERC20("Token A", "TKA", 18)  → copiar dirección como TOKEN_A
 *    b) MockERC20("Token B", "TKB", 18)  → copiar dirección como TOKEN_B
 *    c) LoyaltyToken                     → copiar dirección como LOYALTY_TOKEN
 *
 *  PASO 2 — Desplegar este contrato
 *    LimitOrderLoyaltyHook(address loyaltyTokenAddr)
 *
 *  PASO 3 — Autorizar al hook a mintear SLP
 *    En LoyaltyToken → setHook(address hookAddr)
 *
 *  PASO 4 — Aprobar tokens para el hook
 *    En Token A → approve(hookAddr, 1000 ether)
 *    En Token B → approve(hookAddr, 1000 ether)
 *
 *  PASO 5 — Simular swaps
 *    simulateSwap(TOKEN_A, TOKEN_B, 1 ether, 2000e18)
 *    (compra TKB con 1 TKA al precio actual de 2000 TKB/TKA)
 *
 *  PASO 6 — Poner órdenes límite
 *    placeLimitOrder(TOKEN_A, TOKEN_B, 0.5 ether, 1800e18, 0)
 *    (vender 0.5 TKA si el precio cae a 1800 TKB/TKA)
 *
 *  PASO 7 — Cuando el precio baje, simular un swap al nuevo precio
 *    simulateSwap(TOKEN_A, TOKEN_B, 1 ether, 1800e18)
 *    → la orden límite se ejecuta automáticamente en beforeSwap
 *
 *  PASO 8 — Reclamar recompensas
 *    claimRewards()
 *
 * ════════════════════════════════════════════════════════════════
 *
 *  NOTA: simulateSwap() replica el comportamiento de los hooks v4:
 *    _beforeSwap() → revisa y ejecuta órdenes límite matching
 *    _afterSwap()  → calcula y acumula loyalty rewards
 */
contract LimitOrderLoyaltyHook is Ownable, ReentrancyGuard {
    using CurrencyLibrary for Currency;

    // ════════════════════════════════════════════════
    //                 TIPOS Y CONSTANTES
    // ════════════════════════════════════════════════

    /// @notice Tiers de usuario basados en volumen acumulado
    enum Tier { BRONZE, SILVER, GOLD, PLATINUM }

    /// @notice Estado de una orden límite
    enum OrderStatus { OPEN, EXECUTED, CANCELLED }

    // Umbrales de volumen para subir de tier (en wei)
    uint256 public constant SILVER_THRESHOLD   = 1 ether;    //   1 ETH
    uint256 public constant GOLD_THRESHOLD     = 10 ether;   //  10 ETH
    uint256 public constant PLATINUM_THRESHOLD = 100 ether;  // 100 ETH

    // Tokens SLP base por cada 0.001 ETH de volumen
    // Fórmula: rewardBase = amountIn / 1e15
    // Ej: 1 ETH de swap → 1000 SLP base (antes del multiplicador de tier)
    uint256 public constant BASE_REWARD_DIVISOR = 1e15;

    // Multiplicadores de tier (sobre 100)
    uint256 public constant BRONZE_MULT   = 100; // 1.0x
    uint256 public constant SILVER_MULT   = 150; // 1.5x
    uint256 public constant GOLD_MULT     = 200; // 2.0x
    uint256 public constant PLATINUM_MULT = 300; // 3.0x

    // Máximo de órdenes a revisar por beforeSwap (límite de gas)
    uint256 public constant MAX_ORDERS_PER_HOOK = 20;

    // ── Flash Loan ──
    /// @notice Fee del flash loan en basis points (5 = 0.05%)
    uint256 public constant FLASH_LOAN_FEE_BPS = 5;

    // ════════════════════════════════════════════════
    //                   ESTRUCTURAS
    // ════════════════════════════════════════════════

    /// @notice Orden límite de venta (el usuario vende tokenIn para recibir tokenOut)
    struct LimitOrder {
        uint256 id;
        address owner;
        address tokenIn;      // Token que el usuario vende
        address tokenOut;     // Token que el usuario quiere recibir
        uint256 amountIn;     // Cantidad a vender
        uint256 targetPrice;  // Precio objetivo: amountOut por unidad de amountIn (×1e18)
                              // Ej: 2000e18 = 2000 TKB por 1 TKA
        uint256 minAmountOut; // Mínimo aceptable (slippage protection). 0 = sin límite
        OrderStatus status;
        uint256 createdAt;
        uint256 resolvedAt;   // timestamp de ejecución o cancelación
        uint256 executedAmountOut; // Cuánto recibió realmente
    }

    /// @notice Estadísticas de un usuario para el sistema de rewards
    struct UserStats {
        uint256 totalVolume;    // Volumen total acumulado (en tokenIn, wei)
        uint256 swapCount;      // Número de swaps realizados
        uint256 pendingRewards; // SLP tokens pendientes de reclamar
        uint256 claimedRewards; // SLP tokens ya reclamados
        Tier    tier;           // Tier actual
    }

    /// @notice Historial de flash loans de un usuario
    struct FlashLoanRecord {
        uint256 totalLoans;       // Número total de flash loans ejecutados
        uint256 totalVolume;      // Volumen total prestado (en wei)
        uint256 totalFeesPaid;    // Total de fees pagados al protocolo
        uint256 lastLoanAt;       // Timestamp del último flash loan
    }

    // ════════════════════════════════════════════════
    //                   ESTADO
    // ════════════════════════════════════════════════

    LoyaltyToken public immutable loyaltyToken;

    // Órdenes
    uint256 public nextOrderId = 1;
    mapping(uint256 => LimitOrder) public orders;
    mapping(address => uint256[]) private _userOrderIds;

    // Índice de órdenes abiertas por par de tokens (para beforeSwap)
    // poolId → array de orderIds activos
    mapping(bytes32 => uint256[]) private _poolActiveOrders;

    // Estadísticas de usuarios
    mapping(address => UserStats) public userStats;

    // ── Flash Loan State ──
    /// @notice Liquidez disponible por token para flash loans (token → amount)
    mapping(address => uint256) public poolLiquidity;

    /// @notice Historial de flash loans por usuario
    mapping(address => FlashLoanRecord) public flashLoanRecords;

    // ════════════════════════════════════════════════
    //                    EVENTOS
    // ════════════════════════════════════════════════

    event SwapSimulated(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 price
    );

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 minAmountOut
    );

    event OrderExecuted(
        uint256 indexed orderId,
        address indexed owner,
        uint256 amountOut,
        uint256 executedAt
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed owner,
        uint256 cancelledAt
    );

    event RewardsEarned(
        address indexed user,
        uint256 baseReward,
        uint256 bonusReward,
        uint256 totalPending,
        Tier tier
    );

    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 totalClaimed
    );

    event TierUpgraded(
        address indexed user,
        Tier oldTier,
        Tier newTier,
        uint256 totalVolume
    );

    // ── Flash Loan Events ──

    /**
     * @notice Emitido DENTRO de _executeFlashLoanLogic, confirmando que
     *         los fondos llegaron al prestatario y la lógica se ejecutó.
     * @param currency Token prestado (Currency = address wrapper)
     * @param amount   Cantidad prestada (wei)
     * @param sender   Dirección del prestatario
     */
    event FlashLoanExecuted(
        Currency indexed currency,
        uint256 amount,
        address indexed sender
    );

    /**
     * @notice Emitido al completar el flash loan (después del repago).
     */
    event FlashLoanCompleted(
        address indexed token,
        uint256 indexed amount,
        uint256 fee,
        address indexed borrower,
        uint256 completedAt
    );

    /// @notice Emitido cuando alguien fondea el pool de liquidez
    event PoolFunded(
        address indexed token,
        uint256 amount,
        address indexed funder
    );

    /// @notice Emitido cuando el owner retira liquidez del pool
    event PoolWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed to
    );

    // ════════════════════════════════════════════════
    //                  CONSTRUCTOR
    // ════════════════════════════════════════════════

    constructor(address loyaltyTokenAddr) Ownable(msg.sender) {
        require(loyaltyTokenAddr != address(0), "Hook: invalid loyalty token");
        loyaltyToken = LoyaltyToken(loyaltyTokenAddr);
    }

    // ════════════════════════════════════════════════
    //           HOOK INTERNO: BEFORE SWAP
    // ════════════════════════════════════════════════

    /**
     * @dev Simula el hook beforeSwap de Uniswap v4.
     *      Recorre las órdenes activas del par y ejecuta las que
     *      coincidan con el precio actual (targetPrice <= currentPrice para compras,
     *      o targetPrice >= currentPrice para ventas).
     *
     * @param tokenIn  Token de entrada del swap actual
     * @param tokenOut Token de salida del swap actual
     * @param currentPrice Precio actual del mercado (amountOut/amountIn × 1e18)
     */
    function _beforeSwap(
        address tokenIn,
        address tokenOut,
        uint256 currentPrice
    ) internal {
        bytes32 poolId = _poolId(tokenIn, tokenOut);
        uint256[] storage activeIds = _poolActiveOrders[poolId];

        uint256 len = activeIds.length;
        uint256 checked = 0;

        // Iteramos de atrás hacia adelante para poder hacer swap-and-pop
        for (uint256 i = len; i > 0 && checked < MAX_ORDERS_PER_HOOK; ) {
            i--;
            checked++;
            uint256 oid = activeIds[i];
            LimitOrder storage o = orders[oid];

            // Saltar órdenes ya resueltas (limpieza lazy)
            if (o.status != OrderStatus.OPEN) {
                _removeFromActiveOrders(poolId, i);
                continue;
            }

            // ¿El precio actual alcanza el objetivo?
            // Para una orden de venta de tokenIn → tokenOut:
            //   se ejecuta cuando currentPrice <= targetPrice
            //   (el usuario quería vender cuando el precio llegara a targetPrice)
            bool priceReached = currentPrice <= o.targetPrice;

            if (priceReached) {
                _executeOrder(oid, currentPrice, poolId, i);
            }
        }
    }

    // ════════════════════════════════════════════════
    //           HOOK INTERNO: AFTER SWAP
    // ════════════════════════════════════════════════

    /**
     * @dev Simula el hook afterSwap de Uniswap v4.
     *      Calcula y acumula rewards para el usuario según su tier.
     *
     * @param user     Dirección del usuario que swap
     * @param amountIn Volumen del swap (en unidades del tokenIn, wei)
     */
    function _afterSwap(address user, uint256 amountIn) internal {
        UserStats storage stats = userStats[user];

        // Acumular volumen y conteo
        stats.totalVolume += amountIn;
        stats.swapCount++;

        // Actualizar tier ANTES de calcular rewards (beneficia al usuario)
        Tier oldTier = stats.tier;
        stats.tier = _computeTier(stats.totalVolume);
        if (stats.tier != oldTier) {
            emit TierUpgraded(user, oldTier, stats.tier, stats.totalVolume);
        }

        // Calcular rewards con multiplicador de tier
        uint256 baseReward  = amountIn / BASE_REWARD_DIVISOR;
        uint256 multiplier  = _tierMultiplier(stats.tier);
        uint256 bonusReward = (baseReward * multiplier) / 100;

        stats.pendingRewards += bonusReward;

        emit RewardsEarned(user, baseReward, bonusReward, stats.pendingRewards, stats.tier);
    }

    // ════════════════════════════════════════════════
    //            FUNCIONES PÚBLICAS PRINCIPALES
    // ════════════════════════════════════════════════

    /**
     * @notice Simula un swap sobre el pool y dispara los hooks beforeSwap y afterSwap.
     *
     * @param tokenIn      Dirección del token que el usuario vende
     * @param tokenOut     Dirección del token que el usuario compra
     * @param amountIn     Cantidad de tokenIn a intercambiar (en wei)
     * @param currentPrice Precio actual del mercado (amountOut/amountIn × 1e18)
     *                     Ejemplo: si 1 TKA = 2000 TKB → currentPrice = 2000e18
     *
     * @return amountOut   Cantidad de tokenOut que recibiría el usuario
     *
     * @dev IMPORTANTE: en una integración real con Uniswap v4, esta función
     *      no existe; los hooks son llamados automáticamente por el PoolManager.
     *      Aquí la usamos para demostración en Remix.
     */
    function simulateSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 currentPrice
    )
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        require(tokenIn  != address(0), "Hook: tokenIn zero");
        require(tokenOut != address(0), "Hook: tokenOut zero");
        require(tokenIn  != tokenOut,   "Hook: same token");
        require(amountIn > 0,           "Hook: amountIn is zero");
        require(currentPrice > 0,       "Hook: price is zero");

        // ── beforeSwap ──────────────────────────────────────────
        _beforeSwap(tokenIn, tokenOut, currentPrice);

        // ── Ejecutar el swap (cálculo simplificado) ─────────────
        // amountOut = amountIn × price / 1e18
        amountOut = (amountIn * currentPrice) / 1e18;

        // ── afterSwap ───────────────────────────────────────────
        _afterSwap(msg.sender, amountIn);

        emit SwapSimulated(msg.sender, tokenIn, tokenOut, amountIn, amountOut, currentPrice);
    }

    // ────────────────────────────────────────────────
    //               LIMIT ORDERS
    // ────────────────────────────────────────────────

    /**
     * @notice Coloca una orden límite de venta.
     *
     * @param tokenIn      Token que el usuario quiere vender
     * @param tokenOut     Token que el usuario quiere recibir
     * @param amountIn     Cantidad de tokenIn a vender (wei)
     * @param targetPrice  Precio objetivo de ejecución (amountOut/amountIn × 1e18)
     *                     La orden se ejecuta cuando el precio de mercado <= targetPrice
     * @param minAmountOut Mínimo de tokenOut aceptable (0 = sin restricción)
     *
     * @return orderId     ID único de la orden creada
     *
     * EJEMPLO:
     *   Tienes 1 TKA y quieres venderlo cuando el precio sea 1800 TKB/TKA:
     *   placeLimitOrder(TKA_ADDR, TKB_ADDR, 1e18, 1800e18, 1750e18)
     */
    function placeLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 minAmountOut
    )
        external
        nonReentrant
        returns (uint256 orderId)
    {
        require(tokenIn  != address(0),    "Order: tokenIn zero");
        require(tokenOut != address(0),    "Order: tokenOut zero");
        require(tokenIn  != tokenOut,      "Order: same token");
        require(amountIn > 0,             "Order: amountIn zero");
        require(targetPrice > 0,          "Order: targetPrice zero");

        orderId = nextOrderId++;

        orders[orderId] = LimitOrder({
            id:                orderId,
            owner:             msg.sender,
            tokenIn:           tokenIn,
            tokenOut:          tokenOut,
            amountIn:          amountIn,
            targetPrice:       targetPrice,
            minAmountOut:      minAmountOut,
            status:            OrderStatus.OPEN,
            createdAt:         block.timestamp,
            resolvedAt:        0,
            executedAmountOut: 0
        });

        _userOrderIds[msg.sender].push(orderId);

        bytes32 pid = _poolId(tokenIn, tokenOut);
        _poolActiveOrders[pid].push(orderId);

        emit OrderPlaced(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            targetPrice,
            minAmountOut
        );
    }

    /**
     * @notice Cancela una orden límite propia.
     * @param orderId ID de la orden a cancelar
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage o = orders[orderId];
        require(o.owner  == msg.sender,     "Order: not owner");
        require(o.status == OrderStatus.OPEN, "Order: not open");

        o.status     = OrderStatus.CANCELLED;
        o.resolvedAt = block.timestamp;

        emit OrderCancelled(orderId, msg.sender, block.timestamp);
    }

    /**
     * @notice Keeper manual: intenta ejecutar una orden específica.
     *         Úsala para probar la ejecución sin esperar un swap.
     *
     * @param orderId      ID de la orden a intentar ejecutar
     * @param currentPrice Precio actual del mercado (amountOut/amountIn × 1e18)
     *
     * @return executed    true si la orden fue ejecutada
     */
    function keeperExecuteOrder(
        uint256 orderId,
        uint256 currentPrice
    )
        external
        nonReentrant
        returns (bool executed)
    {
        LimitOrder storage o = orders[orderId];
        require(o.status == OrderStatus.OPEN,    "Order: not open");
        require(currentPrice > 0,                "Order: price zero");
        require(currentPrice <= o.targetPrice,   "Order: price not reached");

        bytes32 pid = _poolId(o.tokenIn, o.tokenOut);

        // Buscar el índice en el array activo
        uint256[] storage activeIds = _poolActiveOrders[pid];
        for (uint256 i = 0; i < activeIds.length; i++) {
            if (activeIds[i] == orderId) {
                _executeOrder(orderId, currentPrice, pid, i);
                return true;
            }
        }

        // Ejecutar aunque no esté en el índice activo
        _executeOrderDirect(orderId, currentPrice);
        return true;
    }

    // ────────────────────────────────────────────────
    //               LOYALTY REWARDS
    // ────────────────────────────────────────────────

    /**
     * @notice Reclama todos los SLP tokens pendientes.
     *         Transfiere los tokens SLP a la wallet del usuario.
     */
    function claimRewards() external nonReentrant {
        UserStats storage stats = userStats[msg.sender];
        uint256 pending = stats.pendingRewards;
        require(pending > 0, "Rewards: nothing to claim");

        stats.pendingRewards  = 0;
        stats.claimedRewards += pending;

        loyaltyToken.mint(msg.sender, pending);

        emit RewardsClaimed(msg.sender, pending, stats.claimedRewards);
    }

    // ────────────────────────────────────────────────
    //              ⚡ FLASH LOANS
    // ────────────────────────────────────────────────

    /**
     * @notice Deposita tokens en el pool de liquidez para flash loans.
     *
     * REMIX — Pasos:
     *   1. Token.approve(hookAddr, amount)
     *   2. hook.fundPool(tokenAddr, amount)
     *
     * @param token  Dirección del token ERC-20 a depositar
     * @param amount Cantidad a depositar (wei)
     */
    function fundPool(address token, uint256 amount) external nonReentrant {
        require(token  != address(0), "FlashLoan: token zero");
        require(amount > 0,           "FlashLoan: amount zero");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        poolLiquidity[token] += amount;
        emit PoolFunded(token, amount, msg.sender);
    }

    /**
     * @notice El owner puede retirar liquidez del pool.
     * @param token  Token a retirar
     * @param amount Cantidad (wei)
     * @param to     Destinatario
     */
    function withdrawPool(address token, uint256 amount, address to) external onlyOwner {
        require(poolLiquidity[token] >= amount, "FlashLoan: insufficient liquidity");
        poolLiquidity[token] -= amount;
        IERC20(token).transfer(to, amount);
        emit PoolWithdrawn(token, amount, to);
    }

    /**
     * @notice Ejecuta un flash loan atómico.
     *
     * ┌─ FLUJO COMPLETO ──────────────────────────────────────────────┐
     * │  1. Prestatario aprueba repago: token.approve(hook, amt+fee)  │
     * │  2. Prestatario llama:  takeFlashLoan(token, amount, data)    │
     * │  3. Hook transfiere `amount` tokens → prestatario            │
     * │  4. Hook llama _executeFlashLoanLogic (emite FlashLoanExecuted│
     * │     y aquí va tu lógica: arbitraje, liquidación, etc.)       │
     * │  5. Hook cobra `amount + fee` vía transferFrom               │
     * │  6. Hook emite FlashLoanCompleted con stats                   │
     * └───────────────────────────────────────────────────────────────┘
     *
     * @param token    Token ERC-20 a pedir prestado
     * @param amount   Cantidad a pedir (wei)
     * @param userData Datos arbitrarios pasados a _executeFlashLoanLogic
     *
     * @return fee     Fee pagado al protocolo
     */
    function takeFlashLoan(
        address token,
        uint256 amount,
        bytes calldata userData
    )
        external
        nonReentrant
        returns (uint256 fee)
    {
        require(token  != address(0),              "FlashLoan: token zero");
        require(amount > 0,                        "FlashLoan: amount zero");
        require(poolLiquidity[token] >= amount,    "FlashLoan: insufficient liquidity");

        fee = (amount * FLASH_LOAN_FEE_BPS) / 10_000;
        uint256 repayAmount = amount + fee;
        Currency currency   = Currency.wrap(token);

        // ── 1. Prestar tokens al usuario ──────────────────────────────
        poolLiquidity[token] -= amount;
        IERC20(token).transfer(msg.sender, amount);

        // ── 2. Ejecutar lógica del flash loan (hook virtual) ──────────
        //    Aquí se emite FlashLoanExecuted y va la lógica custom
        _executeFlashLoanLogic(currency, amount, userData);

        // ── 3. Cobrar repago + fee (el usuario debió hacer approve) ───
        uint256 balBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).transferFrom(msg.sender, address(this), repayAmount);
        require(
            IERC20(token).balanceOf(address(this)) >= balBefore + repayAmount,
            "FlashLoan: repayment failed"
        );
        poolLiquidity[token] += repayAmount;

        // ── 4. Actualizar estadísticas ─────────────────────────────────
        FlashLoanRecord storage rec = flashLoanRecords[msg.sender];
        rec.totalLoans++;
        rec.totalVolume    += amount;
        rec.totalFeesPaid  += fee;
        rec.lastLoanAt      = block.timestamp;

        // ── 5. Rewards por usar flash loans (como si fuera un swap) ───
        _afterSwap(msg.sender, amount);

        emit FlashLoanCompleted(token, amount, fee, msg.sender, block.timestamp);
    }

    /**
     * @notice Lógica interna del flash loan — OVERRIDE este método.
     *
     *   La implementación base solo emite el evento FlashLoanExecuted
     *   confirmando que los fondos llegaron.
     *
     *   En contratos derivados puedes poner aquí:
     *     - Arbitraje entre dos precios
     *     - Liquidación de posiciones subcolateralizadas
     *     - Refinanciación de deuda
     *     - Cualquier operación que requiera capital temporal
     *
     * @param currency Token prestado (Currency wrapper de address)
     * @param amount   Cantidad prestada (wei)
     * @param data     Datos arbitrarios del llamador
     */
    function _executeFlashLoanLogic(
        Currency currency,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        // Aquí puedes poner tu lógica (arbitraje, liquidación, etc.)
        // Por ahora solo emitimos un evento para ver que llegó el dinero
        emit FlashLoanExecuted(currency, amount, msg.sender);
    }

    // ════════════════════════════════════════════════
    //               FUNCIONES DE CONSULTA
    // ════════════════════════════════════════════════

    /**
     * @notice Devuelve las estadísticas completas de un usuario.
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 totalVolume,
            uint256 swapCount,
            uint256 pendingRewards,
            uint256 claimedRewards,
            Tier    tier,
            string memory tierName,
            uint256 rewardMultiplier
        )
    {
        UserStats memory s = userStats[user];
        return (
            s.totalVolume,
            s.swapCount,
            s.pendingRewards,
            s.claimedRewards,
            s.tier,
            _tierName(s.tier),
            _tierMultiplier(s.tier)
        );
    }

    /**
     * @notice Devuelve la lista de IDs de órdenes de un usuario.
     */
    function getUserOrderIds(address user) external view returns (uint256[] memory) {
        return _userOrderIds[user];
    }

    /**
     * @notice Devuelve los detalles de una orden específica.
     */
    function getOrder(uint256 orderId) external view returns (LimitOrder memory) {
        return orders[orderId];
    }

    /**
     * @notice Devuelve los IDs de órdenes activas en un par de tokens.
     */
    function getActiveOrdersForPair(
        address tokenIn,
        address tokenOut
    ) external view returns (uint256[] memory) {
        return _poolActiveOrders[_poolId(tokenIn, tokenOut)];
    }

    /**
     * @notice Devuelve el balance de SLP del usuario.
     */
    function getSLPBalance(address user) external view returns (uint256) {
        return loyaltyToken.balanceOf(user);
    }

    // ── Flash Loan Views ──

    /**
     * @notice Calcula fee y repago de un flash loan hipotético.
     * @param amount Cantidad a pedir (wei)
     * @return fee         Fee del protocolo (0.05%)
     * @return repayAmount Total a devolver = amount + fee
     */
    function previewFlashLoanFee(uint256 amount)
        external
        pure
        returns (uint256 fee, uint256 repayAmount)
    {
        fee         = (amount * FLASH_LOAN_FEE_BPS) / 10_000;
        repayAmount = amount + fee;
    }

    /**
     * @notice Estadísticas de flash loans de un usuario.
     */
    function getFlashLoanStats(address user)
        external
        view
        returns (
            uint256 totalLoans,
            uint256 totalVolume,
            uint256 totalFeesPaid,
            uint256 lastLoanAt
        )
    {
        FlashLoanRecord memory r = flashLoanRecords[user];
        return (r.totalLoans, r.totalVolume, r.totalFeesPaid, r.lastLoanAt);
    }

    /**
     * @notice Liquidez disponible en el pool para un token dado.
     * @param token Dirección del token ERC-20
     * @return Cantidad de tokens disponibles para flash loans (wei)
     */
    function getPoolLiquidity(address token) external view returns (uint256) {
        return poolLiquidity[token];
    }

    /**
     * @notice Calcula cuántos SLP ganaría el usuario por un swap hipotético.
     * @param user      Dirección del usuario
     * @param amountIn  Cantidad de tokenIn (wei)
     * @return slpAmount Cantidad de SLP que ganaría
     */
    function previewRewards(address user, uint256 amountIn)
        external
        view
        returns (uint256 slpAmount)
    {
        UserStats memory s = userStats[user];
        uint256 newVolume  = s.totalVolume + amountIn;
        Tier futureTier    = _computeTier(newVolume);
        uint256 base       = amountIn / BASE_REWARD_DIVISOR;
        return (base * _tierMultiplier(futureTier)) / 100;
    }

    /**
     * @notice Información sobre todos los tiers.
     */
    function getTierInfo()
        external
        pure
        returns (
            string[4] memory names,
            uint256[4] memory thresholds,
            uint256[4] memory multipliers
        )
    {
        names        = ["Bronze", "Silver", "Gold", "Platinum"];
        thresholds   = [uint256(0), SILVER_THRESHOLD, GOLD_THRESHOLD, PLATINUM_THRESHOLD];
        multipliers  = [BRONZE_MULT, SILVER_MULT, GOLD_MULT, PLATINUM_MULT];
    }

    // ════════════════════════════════════════════════
    //               FUNCIONES INTERNAS
    // ════════════════════════════════════════════════

    /// @dev Ejecuta una orden y la elimina del índice activo (usando swap-and-pop)
    function _executeOrder(
        uint256 orderId,
        uint256 currentPrice,
        bytes32 pid,
        uint256 indexInActive
    ) internal {
        LimitOrder storage o = orders[orderId];

        uint256 amountOut = (o.amountIn * currentPrice) / 1e18;

        // Verificar slippage si se especificó minAmountOut
        if (o.minAmountOut > 0) {
            require(amountOut >= o.minAmountOut, "Order: slippage exceeded");
        }

        o.status            = OrderStatus.EXECUTED;
        o.resolvedAt        = block.timestamp;
        o.executedAmountOut = amountOut;

        // Eliminar del array activo (swap-and-pop)
        _removeFromActiveOrders(pid, indexInActive);

        // También acumular rewards para el owner de la orden
        _afterSwap(o.owner, o.amountIn);

        emit OrderExecuted(orderId, o.owner, amountOut, block.timestamp);
    }

    /// @dev Ejecuta directamente una orden sin índice (para keeper manual)
    function _executeOrderDirect(uint256 orderId, uint256 currentPrice) internal {
        LimitOrder storage o = orders[orderId];

        uint256 amountOut = (o.amountIn * currentPrice) / 1e18;

        if (o.minAmountOut > 0) {
            require(amountOut >= o.minAmountOut, "Order: slippage exceeded");
        }

        o.status            = OrderStatus.EXECUTED;
        o.resolvedAt        = block.timestamp;
        o.executedAmountOut = amountOut;

        _afterSwap(o.owner, o.amountIn);

        emit OrderExecuted(orderId, o.owner, amountOut, block.timestamp);
    }

    /// @dev Elimina un elemento del array de órdenes activas usando swap-and-pop
    function _removeFromActiveOrders(bytes32 pid, uint256 index) internal {
        uint256[] storage arr = _poolActiveOrders[pid];
        uint256 last = arr.length - 1;
        if (index != last) {
            arr[index] = arr[last];
        }
        arr.pop();
    }

    /// @dev Calcula el poolId a partir de dos tokens (orden canónico)
    function _poolId(address a, address b) internal pure returns (bytes32) {
        (address t0, address t1) = a < b ? (a, b) : (b, a);
        return keccak256(abi.encodePacked(t0, t1));
    }

    /// @dev Calcula el tier correspondiente a un volumen dado
    function _computeTier(uint256 volume) internal pure returns (Tier) {
        if (volume >= PLATINUM_THRESHOLD) return Tier.PLATINUM;
        if (volume >= GOLD_THRESHOLD)     return Tier.GOLD;
        if (volume >= SILVER_THRESHOLD)   return Tier.SILVER;
        return Tier.BRONZE;
    }

    /// @dev Retorna el multiplicador de rewards para un tier (sobre 100)
    function _tierMultiplier(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.PLATINUM) return PLATINUM_MULT;
        if (tier == Tier.GOLD)     return GOLD_MULT;
        if (tier == Tier.SILVER)   return SILVER_MULT;
        return BRONZE_MULT;
    }

    /// @dev Nombre legible del tier
    function _tierName(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.PLATINUM) return "Platinum";
        if (tier == Tier.GOLD)     return "Gold";
        if (tier == Tier.SILVER)   return "Silver";
        return "Bronze";
    }
}
