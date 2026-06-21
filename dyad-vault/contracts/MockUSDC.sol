// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    // Simularemos un USDC con 18 decimales para facilitar la matemática con usdJ por ahora
    // (El USDC real usa 6 decimales, pero para la hackathon 18 previene dolores de cabeza de conversión)
    constructor() ERC20("Mock USD Coin", "mUSDC") {
        // Le enviamos 1 millón de USDC al creador para dar liquidez a Uniswap
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Faucet público: Cualquiera que llame esta función recibe 1,000 USDC gratis para probar
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
