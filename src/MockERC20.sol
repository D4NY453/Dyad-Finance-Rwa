// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Token ERC-20 de prueba con función mint pública.
 *         Úsalo en Remix para crear TokenA y TokenB de prueba.
 *
 * INSTRUCCIONES REMIX:
 *   1. Despliega MockERC20("Token A", "TKA")
 *   2. Despliega MockERC20("Token B", "TKB")
 *   3. Copia las direcciones → úsalas en LimitOrderLoyaltyHook
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _decimals = decimals_;
        // Mintea 1,000,000 tokens al deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals_);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Cualquiera puede mintear tokens de prueba
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Mint controlado por owner
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
