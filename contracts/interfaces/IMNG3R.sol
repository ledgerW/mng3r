// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

enum AssetType {
    erc20,
    erc721,
    erc1155
}

struct TradeOffer {
    address offerMaker;
    AssetType assetBuyType;
    address toMNG3RAsset;
    uint256[] toMNG3RAmtOrId;
    uint256[] toMNG3R1155Amt;
    AssetType assetPayType;
    address fromMNG3RAsset;
    uint256[] fromMNG3RAmtOrId;
    uint256[] fromMNG3R1155Amt;
    uint256 expirationTime;
}

struct TradeOffers {
    TradeOffer[] erc20Offers;
    TradeOffer[] erc721Offers;
    TradeOffer[] erc1155Offers;
    mapping(address => uint256) erc20Payable;
    mapping(address => mapping(uint256 => uint256)) erc721Payable;
    mapping(address => mapping(uint256 => uint256)) erc1155Payable;
}

interface IMNG3R {
    function initialize(
        address _admin,
        string memory _name,
        string memory _symbol,
        uint256 _supply
    ) external;

    function mint(address to, uint256 amount) external;

    function erc20Transfer(
        address _tokenAddress,
        address to,
        uint256 amt
    ) external;

    function erc721TransferFrom(
        address _tokenAddress,
        address to,
        uint256 tokenId
    ) external;

    function erc1155TransferFrom(
        address _tokenAddress,
        address to,
        uint256 tokenId,
        uint256 qty,
        bytes memory data
    ) external;

    function erc1155BatchTransferFrom(
        address _tokenAddress,
        address to,
        uint256[] memory tokenId,
        uint256[] memory qty,
        bytes memory data
    ) external;
}
