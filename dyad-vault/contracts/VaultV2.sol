// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
contract VaultV2 is Ownable, ReentrancyGuard {
    StableToken public immutable stableToken;
    VolatileToken public immutable volatileToken;
    AggregatorV3Interface internal immutable priceFeed;
    IRealEstateOracle public immutable realEstateOracle;
    IERC721 public immutable rwaCertificate;
    address public immutable treasuryWallet;
    uint256 public constant mintFeePercentage = 1;

    // Llevamos un registro de cuánto usdJ se ha impreso contra cada propiedad
    mapping(uint256 => uint256) public usdJMintedAgainstProperty;

    constructor(address _priceFeedAddress, address _realEstateOracleAddress, address _rwaCertificateAddress) Ownable(msg.sender) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        realEstateOracle = IRealEstateOracle(_realEstateOracleAddress);
        rwaCertificate = IERC721(_rwaCertificateAddress);
        stableToken = new StableToken();
        volatileToken = new VolatileToken();
        treasuryWallet = msg.sender;
        require(_priceFeedAddress != address(0), "Direccion de priceFeed invalida");
        require(_realEstateOracleAddress != address(0), "Direccion de realEstateOracle invalida");
        require(_rwaCertificateAddress != address(0), "Direccion de rwaCertificate invalida");
    }

    function getLatestPrice() public view returns (uint256) {
        // slither-disable-next-line unused-return
        (uint80 roundId, int256 price, , uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();
        require(price > 0, "Precio invalido");
        require(answeredInRound >= roundId, "Feed no actualizado");
        require(updatedAt > 0, "Feed sin datos");
        // slither-disable-next-line timestamp
        require(block.timestamp - updatedAt <= 3600, "Precio obsoleto (mas de 1 hora)");
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

    function redeemStable(uint256 stableAmount) external nonReentrant {
        require(stableToken.balanceOf(msg.sender) >= stableAmount, "Saldo insuficiente");
        uint256 currentPrice = getLatestPrice();
        uint256 ethToReturn = (stableAmount * 1e18) / currentPrice;
        require(address(this).balance >= ethToReturn, "Liquidez insuficiente");
        stableToken.burn(msg.sender, stableAmount);
        
        // slither-disable-next-line arbitrary-send-eth,low-level-calls
        (bool success, ) = payable(msg.sender).call{value: ethToReturn}("");
        require(success, "Transferencia de ETH fallida");
    }

    function redeemVolatile(uint256 volatileAmount) external nonReentrant {
        require(volatileToken.balanceOf(msg.sender) >= volatileAmount, "Saldo insuficiente");
        uint256 currentPrice = getLatestPrice();
        uint256 totalStableSupply = stableToken.totalSupply();
        uint256 totalVolatileSupply = volatileToken.totalSupply();
        require(totalVolatileSupply > 0, "No hay tokens volatiles en circulacion");
        uint256 ethLockedForStables = (totalStableSupply * 1e18) / currentPrice;
        uint256 ethAvailableForVolatiles = address(this).balance > ethLockedForStables ? address(this).balance - ethLockedForStables : 0;
        uint256 ethToReturn = (ethAvailableForVolatiles * volatileAmount) / totalVolatileSupply;
        volatileToken.burn(msg.sender, volatileAmount);
        
        if (ethToReturn > 0) {
            // slither-disable-next-line arbitrary-send-eth,low-level-calls
            (bool success, ) = payable(msg.sender).call{value: ethToReturn}("");
            require(success, "Transferencia de ETH fallida");
        }
    }

    // --- LOGICA RWA ---
    function mintUsdJAgainstRWA(uint256 propertyId) external nonReentrant {
        // 1. Obtener la plusvalía dictada por el Oráculo
        (uint256 propertyPriceInUSD, uint256 timestamp) = realEstateOracle.getLatestPrice(propertyId);
        require(propertyPriceInUSD > 0, "Precio de propiedad invalido");
        require(timestamp > 0, "Timestamp del oraculo invalido");
        // slither-disable-next-line timestamp
        require(block.timestamp - timestamp <= 7 days, "Datos del oraculo obsoletos");
        
        // 2. Colateralización LTV al 80%. Puedes mintear máximo el 80% del valor dictado por el Oráculo
        // CORREGIDO: Multiplicar primero, dividir después para evitar perdida de precision
        uint256 maxMintableWithDecimals = (propertyPriceInUSD * 80 * 1e18) / 100;

        // VERIFICACIÓN DEL NFT: El usuario DEBE ser el dueño del certificado de esta propiedad específica
        require(rwaCertificate.ownerOf(propertyId) == msg.sender, "No posees el Certificado RWA para esta propiedad");
        
        uint256 alreadyMinted = usdJMintedAgainstProperty[propertyId];
        require(maxMintableWithDecimals > alreadyMinted, "Ya extrajiste toda la plusvalia permitida");

        uint256 amountToMint = maxMintableWithDecimals - alreadyMinted;
        
        // 3. Calcular fee del 1%
        uint256 fee = (amountToMint * mintFeePercentage) / 100;
        uint256 netAmount = amountToMint - fee;

        // 4. Registramos la deuda y minteamos
        usdJMintedAgainstProperty[propertyId] += amountToMint;
        stableToken.mint(treasuryWallet, fee);
        stableToken.mint(msg.sender, netAmount);
    }

    receive() external payable {}
}
