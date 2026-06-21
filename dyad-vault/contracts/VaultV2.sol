// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 1. Interfaces
interface AggregatorV3Interface {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

interface IRealEstateOracle {
    function getLatestPrice(uint256 _propertyId) external view returns (uint256 price, uint256 timestamp);
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

// 2. Tokens
contract StableToken is ERC20, Ownable {
    constructor() ERC20("USD J", "usdJ") Ownable(msg.sender) {}
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyOwner { _burn(from, amount); }
}

contract VolatileToken is ERC20, Ownable {
    constructor() ERC20("Volatile ETH", "vETH") Ownable(msg.sender) {}
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyOwner { _burn(from, amount); }
}

// 3. Vault V2 (L1 Crypto + RWA)
contract VaultV2 is Ownable {
    StableToken public stableToken;
    VolatileToken public volatileToken;
    AggregatorV3Interface internal priceFeed;
    IRealEstateOracle public realEstateOracle;
    IERC721 public rwaCertificate;
    address public treasuryWallet;
    uint256 public mintFeePercentage = 1;

    // Llevamos un registro de cuánto usdJ se ha impreso contra cada propiedad
    mapping(uint256 => uint256) public usdJMintedAgainstProperty;

    constructor(address _priceFeedAddress, address _realEstateOracleAddress, address _rwaCertificateAddress) Ownable(msg.sender) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        realEstateOracle = IRealEstateOracle(_realEstateOracleAddress);
        rwaCertificate = IERC721(_rwaCertificateAddress);
        stableToken = new StableToken();
        volatileToken = new VolatileToken();
        treasuryWallet = msg.sender;
    }

    function getLatestPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Precio invalido");
        return uint256(price) * 10**10; 
    }

    // --- LOGICA CRIPTO L1 (Original) ---
    function deposit() external payable {
        require(msg.value > 0, "Debes depositar ETH");
        uint256 currentPrice = getLatestPrice();
        uint256 stableAmountToMint = (msg.value * currentPrice) / 1e18;
        stableToken.mint(msg.sender, stableAmountToMint);
        volatileToken.mint(msg.sender, msg.value); 
    }

    function redeemStable(uint256 _stableAmount) external {
        require(stableToken.balanceOf(msg.sender) >= _stableAmount, "Saldo insuficiente");
        uint256 currentPrice = getLatestPrice();
        uint256 ethToReturn = (_stableAmount * 1e18) / currentPrice;
        require(address(this).balance >= ethToReturn, "Liquidez insuficiente");
        stableToken.burn(msg.sender, _stableAmount);
        payable(msg.sender).transfer(ethToReturn);
    }

    function redeemVolatile(uint256 _volatileAmount) external {
        require(volatileToken.balanceOf(msg.sender) >= _volatileAmount, "Saldo insuficiente");
        uint256 currentPrice = getLatestPrice();
        uint256 totalStableSupply = stableToken.totalSupply();
        uint256 totalVolatileSupply = volatileToken.totalSupply();
        uint256 ethLockedForStables = (totalStableSupply * 1e18) / currentPrice;
        uint256 ethAvailableForVolatiles = address(this).balance > ethLockedForStables ? address(this).balance - ethLockedForStables : 0;
        uint256 ethToReturn = (ethAvailableForVolatiles * _volatileAmount) / totalVolatileSupply;
        volatileToken.burn(msg.sender, _volatileAmount);
        if (ethToReturn > 0) payable(msg.sender).transfer(ethToReturn);
    }

    // --- NUEVA LOGICA RWA ---
    function mintUsdJAgainstRWA(uint256 _propertyId) external {
        // 1. Obtener la plusvalía dictada por el Oráculo
        (uint256 propertyPriceInUSD, ) = realEstateOracle.getLatestPrice(_propertyId);
        
        // 2. Colateralización LTV al 80%. Puedes mintear máximo el 80% del valor dictado por el Oráculo
        uint256 maxMintable = (propertyPriceInUSD * 80) / 100;
        uint256 maxMintableWithDecimals = maxMintable * 1e18;

        // VERIFICACIÓN DEL NFT: El usuario DEBE ser el dueño del certificado de esta propiedad específica
        require(rwaCertificate.ownerOf(_propertyId) == msg.sender, "No posees el Certificado RWA para esta propiedad");
        
        uint256 alreadyMinted = usdJMintedAgainstProperty[_propertyId];
        require(maxMintableWithDecimals > alreadyMinted, "Ya extrajiste toda la plusvalia permitida");

        uint256 amountToMint = maxMintableWithDecimals - alreadyMinted;
        
        // 3. Calcular fee del 1%
        uint256 fee = (amountToMint * mintFeePercentage) / 100;
        uint256 netAmount = amountToMint - fee;

        // 4. Registramos la deuda y minteamos
        usdJMintedAgainstProperty[_propertyId] += amountToMint;
        stableToken.mint(treasuryWallet, fee);
        stableToken.mint(msg.sender, netAmount);
    }

    receive() external payable {}
}
