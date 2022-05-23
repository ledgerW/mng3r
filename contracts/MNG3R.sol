// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import "./libraries/ERC20Handler.sol";
import "./libraries/ERC721Handler.sol";
import "./libraries/ERC1155Handler.sol";

/// @title MNG3R implementation contract
/// @author Ledger West
/// @notice This is the MNG3R contract
/// @dev This the implementation for a minimal proxy deployed by the factory
contract MNG3R is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using ERC20Handler for TradeOffers;
    using ERC721Handler for TradeOffers;
    using ERC1155Handler for TradeOffers;

    // ====================================== //
    // =============== State ================ //
    // ====================================== //
    /// @notice Address to send protocol fees
    address immutable MNG3R_PROTOCOL =
        0xdB9678Ac90284590B7cb95990768692B192a1011;

    /// @notice Protocol fee in basis points
    uint256 constant MNG3R_PROTOCOL_BP = 50;

    /// @notice Protocol fee as percent
    //uint256 constant MNG3R_PROTOCOL_FEE = MNG3R_PROTOCOL_BP / 10000;

    /// @notice Current mng3r of this MNG3R contract
    address public mng3r;

    /// @notice mng3r annual management fee in basis points
    uint256 public mng3rFee;

    /// @notice the last timestamp where fees were claimed
    uint256 public lastClaimedFee;

    /// @notice List of ERC20 addresses held by this contract
    address[] public holding20;

    struct Holding721 {
        address operator;
        address nft;
        uint256 id;
        uint256 qty;
    }

    /// @notice Map of ERC721 held by this contract
    mapping(uint256 => Holding721) public holding721;
    uint256 public num721;

    struct Holding1155 {
        address from;
        address nft;
        uint256 id;
        uint256 qty;
    }

    /// @notice Map of ERC1155 held by this contract
    mapping(uint256 => Holding1155) public holding1155;
    uint256 public num1155;

    // current open offers
    TradeOffers private tradeOffers;

    // governance roles
    bytes32 public constant MNG3R_ROLE = keccak256("MNG3R_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    // ====================================== //
    // ========== Events & Errors =========== //
    // ====================================== //

    event NewMNG3R(address _oldMNG3R, address _newMNG3R);
    event NewMNG3RFee(uint256 _oldMNG3RFee, uint256 _newFee);
    event SentETH(address to, uint256 amt);
    event SentERC20(address tokenAddress, address to, uint256 amt);
    event ReceivedERC721(address operator, address from, uint256 tokenId);
    event SentERC721(address tokenAddress, address to, uint256 tokenId);
    event ReceivedERC1155(
        address from,
        address tokenAddress,
        uint256 tokenId,
        uint256 qty
    );
    event SentERC1155(
        address tokenAddress,
        address to,
        uint256 tokenId,
        uint256 qty
    );
    event ReceivedBatchERC1155(
        address from,
        address tokenAddress,
        uint256[] tokenId,
        uint256[] qty
    );
    event SentBatchERC1155(
        address tokenAddress,
        address to,
        uint256[] tokenId,
        uint256[] qty
    );

    error ExceedsPayableObligations(
        uint256 currentHolding,
        uint256 stillPayable
    );

    // ====================================== //
    // ============ Modifiers =============== //
    // ====================================== //

    /// @dev Prevent transfer of ERC20 exceeding payable
    /// @param _tokenAddress asset address
    /// @param _amtToSend amount of asset to be transferred
    modifier reserveERC20Payable(address _tokenAddress, uint256 _amtToSend) {
        uint256 currentHolding = erc20BalanceOf(_tokenAddress);
        uint256 stillPayable = getERC20Payable(_tokenAddress);
        uint256 amtRemaining = currentHolding - _amtToSend;

        if (amtRemaining < stillPayable) {
            revert ExceedsPayableObligations(currentHolding, stillPayable);
        }
        _;
    }

    /// @dev Prevent transfer of ERC721 exceeding payable
    /// @param _tokenAddress asset address
    /// @param _tokenId Id of asset to be transferred
    modifier reserveERC721Payable(address _tokenAddress, uint256 _tokenId) {
        uint256 currentHolding = erc721BalanceOf(_tokenAddress);
        uint256 stillPayable = getERC721Payable(_tokenAddress, _tokenId);
        uint256 amtRemaining = currentHolding - 1;

        if (amtRemaining < stillPayable) {
            revert ExceedsPayableObligations(currentHolding, stillPayable);
        }
        _;
    }

    /// @dev Prevent transfer of ERC1155 exceeding payable
    /// @param _tokenAddress asset address
    /// @param _tokenId Id of asset to be transferred
    /// @param _qtyToSend qty of asset Id to be transferred
    modifier reserveERC1155Payable(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _qtyToSend
    ) {
        uint256 currentHolding = erc1155BalanceOf(_tokenAddress, _tokenId);
        uint256 stillPayable = getERC1155Payable(_tokenAddress, _tokenId);
        uint256 amtRemaining = currentHolding - _qtyToSend;

        if (amtRemaining < stillPayable) {
            revert ExceedsPayableObligations(currentHolding, stillPayable);
        }
        _;
    }

    /// @dev Prevent transfer of ERC1155 exceeding payable
    /// @param _tokenAddress asset address
    /// @param _tokenId List of Id of asset to be transferred
    /// @param _qtyToSend List of qty of asset Id to be transferred
    modifier reserveERC1155BatchPayable(
        address _tokenAddress,
        uint256[] memory _tokenId,
        uint256[] memory _qtyToSend
    ) {
        for (uint256 id = 0; id < _tokenId.length; id++) {
            uint256 currentHolding = erc1155BalanceOf(
                _tokenAddress,
                _tokenId[id]
            );
            uint256 stillPayable = getERC1155Payable(
                _tokenAddress,
                _tokenId[id]
            );
            uint256 amtRemaining = currentHolding - _qtyToSend[id];

            if (amtRemaining < stillPayable) {
                revert ExceedsPayableObligations(currentHolding, stillPayable);
            }
        }

        _;
    }

    // ====================================== //
    // ============ Functions =============== //
    // ====================================== //

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address _mng3r,
        string memory _name,
        string memory _symbol,
        uint256 _supply
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __ERC20Permit_init(_name);

        _grantRole(DEFAULT_ADMIN_ROLE, _mng3r);
        _grantRole(MNG3R_ROLE, _mng3r);
        _grantRole(MINTER_ROLE, _mng3r);
        _grantRole(TRANSFER_ROLE, _mng3r);
        _grantRole(MINTER_ROLE, address(this));
        _grantRole(TRANSFER_ROLE, address(this));
        _mint(_mng3r, _supply);
        _mint(MNG3R_PROTOCOL, (_supply * MNG3R_PROTOCOL_BP) / 10000);

        mng3r = _mng3r;
        mng3rFee = 200;
        num721 = 0;
        num1155 = 0;
    }

    // ======== Basic Functionality ========= //
    // ========

    receive() external payable {}

    fallback() external payable {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155ReceiverUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(account, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(to, amount);
    }

    function mint(address to, uint256 amt) public onlyRole(MINTER_ROLE) {
        _mint(to, amt);
        _mint(MNG3R_PROTOCOL, (amt * MNG3R_PROTOCOL_BP) / 10000);
    }

    function pause() public onlyRole(MNG3R_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(MNG3R_ROLE) {
        _unpause();
    }

    /// @notice Transfer ETH using standard msg.value
    /// @param _to address of recipient
    function sendETH(address _to) public payable onlyRole(TRANSFER_ROLE) {
        payable(_to).transfer(msg.value);

        emit SentETH(_to, msg.value);
    }

    /// @notice Set a new mng3r of this contract
    /// @param _newMNG3R address of new mng3r
    function setMNG3R(address _newMNG3R) public onlyRole(MNG3R_ROLE) {
        address oldMNG3R = mng3r;
        mng3r = _newMNG3R;

        emit NewMNG3R(oldMNG3R, _newMNG3R);
    }

    /// @notice Set a new mng3r annual fee
    /// @param _newFee amount of new fee in basis points
    function setMNG3RFee(uint256 _newFee) public onlyRole(MNG3R_ROLE) {
        uint256 oldMNG3RFee = mng3rFee;
        mng3rFee = _newFee;

        emit NewMNG3RFee(oldMNG3RFee, _newFee);
    }

    /// @notice let mng3r claim mangement fee
    function claimFees() public onlyRole(MNG3R_ROLE) {
        // get how much in fees the mng3r would make in a year
        uint256 currentAnnualFee = (mng3rFee / 10000) * totalSupply();
        // get how much that is per second;
        uint256 feePerSecond = currentAnnualFee / 31536000;
        // get how many seconds they are eligible to claim
        uint256 sinceLastClaim = block.timestamp - lastClaimedFee;
        // get the amount of tokens to mint
        uint256 mng3rFeeMint = sinceLastClaim * feePerSecond;

        lastClaimedFee = block.timestamp;

        mint(mng3r, mng3rFeeMint);
    }

    // =========== Handle ERC20 ============ //
    // ===========

    /// @notice Get list of ERC20 addresses held by this MNG3R
    /// @return List of ERC20 addresses
    function getHoldingERC20() public view returns (address[] memory) {
        return holding20;
    }

    /// @notice Get this MNG3R's balance of given ERC20
    /// @param _tokenAddress address of ERC20 contract
    /// @return This MNG3R's balance
    function erc20BalanceOf(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        return token.balanceOf(address(this));
    }

    /// @dev called in OfferERC20 function to udpate holdings record
    /// @param _tokenAddress ERC20 address to add to holding record
    function _receivedERC20(address _tokenAddress) internal {
        bool exists = false;
        for (uint256 i = 0; i < holding20.length; i++) {
            if (holding20[i] == _tokenAddress) {
                exists = true;
            }
        }

        if (!exists) {
            holding20.push(_tokenAddress);
        }
    }

    /// @notice transfer ERC20 from this MNG3R to _to
    /// @param _tokenAddress ERC20 address to send
    /// @param _to recipient
    /// @param _amt amount to send
    function erc20Transfer(
        address _tokenAddress,
        address _to,
        uint256 _amt
    ) public onlyRole(TRANSFER_ROLE) reserveERC20Payable(_tokenAddress, _amt) {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransfer(_to, _amt);
        emit SentERC20(_tokenAddress, _to, _amt);
    }

    // ====== Handle ERC20 Library ============ //
    // ===========

    /// @notice Get amount of given ERC20 this MNG3R is liable for from offers
    /// @param _tokenAddress ERC20 address to check
    /// @return Amount payable (liable for)
    function getERC20Payable(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        return tradeOffers.erc20Payable[_tokenAddress];
    }

    /// @notice Get ERC20 for given index
    /// @param _idx index of storage erc20Offers list
    /// @return The TradeOffer struct
    function getERC20Offer(uint256 _idx)
        public
        view
        returns (TradeOffer memory)
    {
        return tradeOffers.erc20Offers[_idx];
    }

    /// @notice Get number of open ERC20
    /// @return The number of offers
    function getNumERC20Offers() public view returns (uint256) {
        return tradeOffers._getNumERC20Offers();
    }

    /// @notice Offer that expires in N seconds to sell amt of ERC20 to MNG3R for given asset
    /// @dev Offerer must first approve/increaseAllowance for this MNG3R to transfer the offer
    /// @param _toMNG3RAsset ERC20 address offered to MNG3R
    /// @param _toMNG3RAmtOrId amount of ERC20 offered
    /// @param _assetPayType type of asset requested from MNG3R (20, 721, or 1155)
    /// @param _fromMNG3RAsset address of asset requested
    /// @param _fromMNG3RAmtOrId amount or id of asset requested
    /// @param _fromMNG3R1155Amt if 1155, quantity of id requested
    /// @param expiresInSeconds duration in seconds before offer expires
    function offerERC20ToFund(
        address _toMNG3RAsset,
        uint256[] memory _toMNG3RAmtOrId,
        AssetType _assetPayType,
        address _fromMNG3RAsset,
        uint256[] memory _fromMNG3RAmtOrId,
        uint256[] memory _fromMNG3R1155Amt,
        uint256 expiresInSeconds
    ) public whenNotPaused {
        TradeOffer memory _tradeOffer = TradeOffer({
            offerMaker: msg.sender,
            assetBuyType: AssetType.erc20,
            toMNG3RAsset: _toMNG3RAsset,
            toMNG3RAmtOrId: _toMNG3RAmtOrId,
            toMNG3R1155Amt: new uint256[](0),
            assetPayType: _assetPayType,
            fromMNG3RAsset: _fromMNG3RAsset,
            fromMNG3RAmtOrId: _fromMNG3RAmtOrId,
            fromMNG3R1155Amt: _fromMNG3R1155Amt,
            expirationTime: expiresInSeconds
        });

        tradeOffers._offerERC20ToFund(_tradeOffer);

        _receivedERC20(_toMNG3RAsset);
    }

    /// @notice Return offered ERC20 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc20Offer to return
    function returnExpiredERC20Offer(uint256 idx) public whenNotPaused {
        tradeOffers._returnExpiredERC20Offer(idx);
    }

    /// @notice Return offered ERC20 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc20Offer to return
    /// @param assetPayType type of asset MNG3R is paying with (20, 721, 1155)
    function acceptERC20Offer(uint256 idx, AssetType assetPayType)
        public
        whenNotPaused
        onlyRole(MNG3R_ROLE)
    {
        tradeOffers._acceptERC20Offer(idx, assetPayType);
    }

    // ========== Handle ERC721 ============== //
    // ==========

    /// @notice Get this MNG3R's balance of given ERC721
    /// @param _tokenAddress address of ERC721 contract
    /// @return This MNG3R's balance
    function erc721BalanceOf(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        IERC721Upgradeable token = IERC721Upgradeable(_tokenAddress);
        return token.balanceOf(address(this));
    }

    /// @notice transfer ERC721 from this MNG3R to _to
    /// @param _tokenAddress ERC721 address to send
    /// @param _to recipient
    /// @param _tokenId id to send
    function erc721TransferFrom(
        address _tokenAddress,
        address _to,
        uint256 _tokenId
    )
        public
        onlyRole(TRANSFER_ROLE)
        reserveERC721Payable(_tokenAddress, _tokenId)
    {
        IERC721Upgradeable token = IERC721Upgradeable(_tokenAddress);
        token.safeTransferFrom(address(this), _to, _tokenId);
        emit SentERC721(_tokenAddress, _to, _tokenId);

        // update holding record
        for (uint256 i = 0; i < num721; i++) {
            Holding721 storage nft = holding721[i];
            if (nft.nft == _tokenAddress && nft.id == _tokenId) {
                nft.qty = 0;
            }
        }
    }

    /// @dev ERC721 override to track holdings in-contract
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public virtual override(ERC721HolderUpgradeable) returns (bytes4) {
        holding721[num721] = Holding721({
            operator: operator,
            nft: msg.sender,
            id: tokenId,
            qty: 1
        });
        num721++;

        emit ReceivedERC721(operator, msg.sender, tokenId);

        return this.onERC721Received.selector;
    }

    // ===== Handle ERC721 Library =========== //
    // ==========

    /// @notice Get amount of given ERC721 this MNG3R is liable for from offers
    /// @param _tokenAddress ERC721 address to check
    /// @param _tokenId Id to check
    /// @return Amount payable (liable for)
    function getERC721Payable(address _tokenAddress, uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return tradeOffers.erc721Payable[_tokenAddress][_tokenId];
    }

    /// @notice Get ERC721 for given index
    /// @param _idx index of storage erc721Offers list
    /// @return The TradeOffer struct
    function getERC721Offer(uint256 _idx)
        public
        view
        returns (TradeOffer memory)
    {
        return tradeOffers.erc721Offers[_idx];
    }

    /// @notice Get number of open ERC721
    /// @return The number of offers
    function getNumERC721Offers() public view returns (uint256) {
        return tradeOffers._getNumERC721Offers();
    }

    /// @notice Offer that expires in N seconds to sell id of ERC721 to MNG3R for given asset
    /// @dev Offerer must first approve/increaseAllowance for this MNG3R to transfer the offer
    /// @param _toMNG3RAsset ERC721 address offered to MNG3R
    /// @param _toMNG3RAmtOrId id of ERC721 offered
    /// @param _assetPayType type of asset requested from MNG3R (20, 721, or 1155)
    /// @param _fromMNG3RAsset address of asset requested
    /// @param _fromMNG3RAmtOrId amount or id of asset requested
    /// @param _fromMNG3R1155Amt if 1155, quantity of id requested
    /// @param expiresInSeconds duration in seconds before offer expires
    function offerERC721ToFund(
        address _toMNG3RAsset,
        uint256[] memory _toMNG3RAmtOrId,
        AssetType _assetPayType,
        address _fromMNG3RAsset,
        uint256[] memory _fromMNG3RAmtOrId,
        uint256[] memory _fromMNG3R1155Amt,
        uint256 expiresInSeconds
    ) public whenNotPaused {
        TradeOffer memory _tradeOffer = TradeOffer({
            offerMaker: msg.sender,
            assetBuyType: AssetType.erc721,
            toMNG3RAsset: _toMNG3RAsset,
            toMNG3RAmtOrId: _toMNG3RAmtOrId,
            toMNG3R1155Amt: new uint256[](0),
            assetPayType: _assetPayType,
            fromMNG3RAsset: _fromMNG3RAsset,
            fromMNG3RAmtOrId: _fromMNG3RAmtOrId,
            fromMNG3R1155Amt: _fromMNG3R1155Amt,
            expirationTime: expiresInSeconds
        });

        tradeOffers._offerERC721ToFund(_tradeOffer);
    }

    /// @notice Return offered ERC721 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc721Offer to return
    function returnExpiredERC721Offer(uint256 idx) public whenNotPaused {
        tradeOffers._returnExpiredERC721Offer(idx);
    }

    /// @notice Return offered ERC721 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc721Offer to return
    /// @param assetPayType type of asset MNG3R is paying with (20, 721, 1155)
    function acceptERC721Offer(uint256 idx, AssetType assetPayType)
        public
        whenNotPaused
        onlyRole(MNG3R_ROLE)
    {
        tradeOffers._acceptERC721Offer(idx, assetPayType);
    }

    // ========== Handle ERC1155 ============= //
    // ==========

    /// @notice Get this MNG3R's balance of given ERC1155 token
    /// @param _tokenAddress address of ERC1155 contract
    /// @param _tokenId id of token to check
    /// @return This MNG3R's balance of that id
    function erc1155BalanceOf(address _tokenAddress, uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        IERC1155Upgradeable token = IERC1155Upgradeable(_tokenAddress);
        return token.balanceOf(address(this), _tokenId);
    }

    /// @notice transfer ERC1155 from this MNG3R to _to
    /// @param _tokenAddress ERC721 address to send
    /// @param _to recipient
    /// @param _tokenId id to send
    /// @param _qty amount of id to send
    /// @param _data additional data
    function erc1155TransferFrom(
        address _tokenAddress,
        address _to,
        uint256 _tokenId,
        uint256 _qty,
        bytes memory _data
    )
        public
        onlyRole(TRANSFER_ROLE)
        reserveERC1155Payable(_tokenAddress, _tokenId, _qty)
    {
        IERC1155Upgradeable token = IERC1155Upgradeable(_tokenAddress);
        token.safeTransferFrom(address(this), _to, _tokenId, _qty, _data);
        emit SentERC1155(_tokenAddress, _to, _tokenId, _qty);

        // update holding record
        for (uint256 i = 0; i < num1155; i++) {
            Holding1155 storage nft = holding1155[i];
            if (nft.nft == _tokenAddress && nft.id == _tokenId) {
                nft.qty = nft.qty - _qty;
            }
        }
    }

    /// @notice transfer ERC1155 from this MNG3R to _to
    /// @param _tokenAddress ERC721 address to send
    /// @param _to recipient
    /// @param _tokenId list of ids to send
    /// @param _qty list of amount of corresponding ids to send
    /// @param _data additional data
    function erc1155BatchTransferFrom(
        address _tokenAddress,
        address _to,
        uint256[] memory _tokenId,
        uint256[] memory _qty,
        bytes memory _data
    )
        public
        onlyRole(TRANSFER_ROLE)
        reserveERC1155BatchPayable(_tokenAddress, _tokenId, _qty)
    {
        IERC1155Upgradeable token = IERC1155Upgradeable(_tokenAddress);
        token.safeBatchTransferFrom(address(this), _to, _tokenId, _qty, _data);
        emit SentBatchERC1155(_tokenAddress, _to, _tokenId, _qty);

        // update holding record
        for (uint256 i = 0; i < num1155; i++) {
            Holding1155 storage nft = holding1155[i];
            for (uint256 id = 0; id < _tokenId.length; id++) {
                if (nft.nft == _tokenAddress && nft.id == _tokenId[id]) {
                    nft.qty = nft.qty - _qty[id];
                }
            }
        }
    }

    /// @dev ERC1155 override to track holdings in-contract
    function onERC1155Received(
        address operator,
        address from,
        uint256 tokenId,
        uint256 value,
        bytes memory data
    ) public virtual override(ERC1155HolderUpgradeable) returns (bytes4) {
        holding1155[num1155] = Holding1155({
            from: operator,
            nft: msg.sender,
            id: tokenId,
            qty: value
        });
        num1155++;

        emit ReceivedERC1155(operator, msg.sender, tokenId, value);

        return this.onERC1155Received.selector;
    }

    /// @dev ERC1155 override to track holdings in-contract
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory tokenId,
        uint256[] memory value,
        bytes memory data
    ) public virtual override(ERC1155HolderUpgradeable) returns (bytes4) {
        for (uint256 id = 0; id < tokenId.length; id++) {
            holding1155[num1155] = Holding1155({
                from: operator,
                nft: msg.sender,
                id: tokenId[id],
                qty: value[id]
            });
            num1155++;
        }

        emit ReceivedBatchERC1155(operator, msg.sender, tokenId, value);

        return this.onERC1155BatchReceived.selector;
    }

    // ===== Handle ERC1155 Library =========== //
    // ==========

    /// @notice Get amount of given ERC1155 this MNG3R is liable for from offers
    /// @param _tokenAddress ERC1155 address to check
    /// @param _tokenId Id to check
    /// @return Amount payable (liable for)
    function getERC1155Payable(address _tokenAddress, uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return tradeOffers.erc1155Payable[_tokenAddress][_tokenId];
    }

    /// @notice Get ERC1155 for given index
    /// @param _idx index of storage erc1155Offers list
    /// @return The TradeOffer struct
    function getERC1155Offer(uint256 _idx)
        public
        view
        returns (TradeOffer memory)
    {
        return tradeOffers.erc1155Offers[_idx];
    }

    /// @notice Get number of open ERC1155
    /// @return The number of offers
    function getNumERC1155Offers() public view returns (uint256) {
        return tradeOffers._getNumERC1155Offers();
    }

    /// @notice Offer that expires in N seconds to sell id(s) of ERC1155 to MNG3R for given asset
    /// @dev Offerer must first approve/increaseAllowance for this MNG3R to transfer the offer
    /// @param _toMNG3RAsset ERC1155 address offered to MNG3R
    /// @param _toMNG3RAmtOrId id(s) of ERC1155 offered
    /// @param _assetPayType type of asset requested from MNG3R (20, 721, or 1155)
    /// @param _fromMNG3RAsset address of asset requested
    /// @param _fromMNG3RAmtOrId amount or id of asset requested
    /// @param _fromMNG3R1155Amt if 1155, quantity of id requested
    /// @param expiresInSeconds duration in seconds before offer expires
    function offerERC1155ToFund(
        address _toMNG3RAsset,
        uint256[] memory _toMNG3RAmtOrId,
        uint256[] memory _toMNG3R1155Amt,
        AssetType _assetPayType,
        address _fromMNG3RAsset,
        uint256[] memory _fromMNG3RAmtOrId,
        uint256[] memory _fromMNG3R1155Amt,
        uint256 expiresInSeconds
    ) public whenNotPaused {
        TradeOffer memory _tradeOffer = TradeOffer({
            offerMaker: msg.sender,
            assetBuyType: AssetType.erc1155,
            toMNG3RAsset: _toMNG3RAsset,
            toMNG3RAmtOrId: _toMNG3RAmtOrId,
            toMNG3R1155Amt: _toMNG3R1155Amt,
            assetPayType: _assetPayType,
            fromMNG3RAsset: _fromMNG3RAsset,
            fromMNG3RAmtOrId: _fromMNG3RAmtOrId,
            fromMNG3R1155Amt: _fromMNG3R1155Amt,
            expirationTime: expiresInSeconds
        });

        tradeOffers._offerERC1155ToFund(_tradeOffer);
    }

    /// @notice Return offered ERC1155 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc1155Offer to return
    function returnExpiredERC1155Offer(uint256 idx) public whenNotPaused {
        tradeOffers._returnExpiredERC1155Offer(idx);
    }

    /// @notice Return offered ERC1155 asset to offerer of an expired offer
    /// @dev anyone can call this to return asset to offerer
    /// @param idx index of erc1155Offer to return
    /// @param assetPayType type of asset MNG3R is paying with (20, 721, 1155)
    function acceptERC1155Offer(uint256 idx, AssetType assetPayType)
        public
        whenNotPaused
        onlyRole(MNG3R_ROLE)
    {
        tradeOffers._acceptERC1155Offer(idx, assetPayType);
    }
}
