// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoyaltyToken (SLP - Swap Loyalty Points)
 * @notice Token ERC-20 de recompensas. Solo el hook puede mintearlo.
 *
 * Tiers de recompensa:
 *   🥉 BRONZE   → 1x  multiplicador  (volumen < 1 ETH)
 *   🥈 SILVER   → 1.5x multiplicador (volumen >= 1 ETH)
 *   🥇 GOLD     → 2x  multiplicador  (volumen >= 10 ETH)
 *   💎 PLATINUM → 3x  multiplicador  (volumen >= 100 ETH)
 */
contract LoyaltyToken is ERC20, Ownable {
    address public hook;

    event HookSet(address indexed hookAddress);

    constructor() ERC20("Swap Loyalty Points", "SLP") Ownable(msg.sender) {}

    /// @notice Establece el contrato hook autorizado a mintear (llamar después de desplegar el hook)
    function setHook(address hookAddress) external onlyOwner {
        require(hookAddress != address(0), "LoyaltyToken: zero address");
        hook = hookAddress;
        emit HookSet(hookAddress);
    }

    /// @notice Solo el hook puede mintear rewards
    function mint(address to, uint256 amount) external {
        require(msg.sender == hook, "LoyaltyToken: only hook can mint");
        _mint(to, amount);
    }

    /// @notice El owner puede mintear para pruebas
    function mintOwner(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
