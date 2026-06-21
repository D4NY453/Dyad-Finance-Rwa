// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockDex {
    IERC20 public usdj;
    IERC20 public usdc;

    constructor(address _usdj, address _usdc) {
        usdj = IERC20(_usdj);
        usdc = IERC20(_usdc);
    }

    // Intercambia usdJ por USDC 1:1
    function swapUsdjForUsdc(uint256 amount) external {
        // 1. El Dex le quita los usdJ al usuario
        require(usdj.transferFrom(msg.sender, address(this), amount), "Fallo al transferir usdJ al Dex");
        
        // 2. El Dex le envía USDC al usuario
        require(usdc.transfer(msg.sender, amount), "El Dex no tiene suficiente liquidez de USDC");
    }

    // Permite al contrato recibir ETH de ti para tener liquidez
    receive() external payable {}

    // Intercambia USDC por ETH (Simulacion off-ramp: 1 ETH = 1,000,000 USDC para que te alcance tu saldo real)
    function swapUsdcForEth(uint256 amountUsdc) external {
        // 1. El Dex le quita los USDC al usuario
        require(usdc.transferFrom(msg.sender, address(this), amountUsdc), "Fallo al transferir USDC al Dex");
        
        // 2. Calculamos el ETH a enviar (25000 USDC = 0.025 ETH)
        uint256 ethToSend = amountUsdc / 1000000;
        
        // 3. El Dex le envia el ETH al usuario
        require(address(this).balance >= ethToSend, "El Dex no tiene liquidez de ETH");
        (bool success, ) = msg.sender.call{value: ethToSend}("");
        require(success, "Fallo al enviar ETH");
    }
}
