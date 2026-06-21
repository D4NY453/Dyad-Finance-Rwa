// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RWACertificate is ERC721URIStorage, Ownable {
    // Tasador u Oráculo autorizado para emitir certificados
    address public authorizedOracle;

    modifier onlyOracle() {
        require(msg.sender == authorizedOracle || msg.sender == owner(), "No autorizado");
        _;
    }

    constructor() ERC721("RWA Property Certificate", "RWAC") Ownable(msg.sender) {
        authorizedOracle = msg.sender;
    }

    function setOracle(address _oracle) external onlyOwner {
        authorizedOracle = _oracle;
    }

    function mintCertificate(address to, uint256 propertyId, string memory tokenURI) external onlyOracle {
        _mint(to, propertyId);
        _setTokenURI(propertyId, tokenURI);
    }
}
