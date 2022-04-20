// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "../interfaces/IMNG3R.sol";
import {TradeOffer, TradeOffers, AssetType} from "../interfaces/IMNG3R.sol";

/// @title ERC20 libary for MNG3R contract
/// @author Ledger West
/// @notice This library provides ERC20 handling functionality for MNG3R
library ERC20Handler {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // ====================================== //
    // ========== Events & Errors =========== //
    // ====================================== //
    event ReceivedERC20TradeOffer(TradeOffer _tradeOffer);
    event ReturnedERC20TradeOffer(TradeOffer _tradeOffer);
    event AcceptedERC20TradeOffer(TradeOffer _tradeOffer);

    error OfferNotExpired();
    error OfferHasExpired();

    // ====================================== //
    // ============= Modifiers ============== //
    // ====================================== //
    modifier validOfferParams(TradeOffer memory _tradeOffer) {
        if (
            _tradeOffer.assetBuyType == AssetType.erc20 ||
            _tradeOffer.assetBuyType == AssetType.erc721
        ) {
            require(
                _tradeOffer.toMNG3RAmtOrId.length == 1,
                "ERC20 and ERC721 OfferAmt Must Have Length 1"
            );
        }

        if (
            _tradeOffer.assetPayType == AssetType.erc20 ||
            _tradeOffer.assetPayType == AssetType.erc721
        ) {
            require(
                _tradeOffer.fromMNG3RAmtOrId.length == 1,
                "ERC20 and ERC721 RequestAmt Must Have Length 1"
            );
        }

        if (_tradeOffer.assetBuyType == AssetType.erc1155) {
            require(
                _tradeOffer.toMNG3RAmtOrId.length ==
                    _tradeOffer.toMNG3R1155Amt.length,
                "ERC1155 Offer Id and Amt Must Be Same Length"
            );
        }

        if (_tradeOffer.assetPayType == AssetType.erc1155) {
            require(
                _tradeOffer.fromMNG3RAmtOrId.length ==
                    _tradeOffer.fromMNG3R1155Amt.length,
                "ERC1155 Request Id and Amt Must Be Same Length"
            );
        }

        _;
    }

    // ====================================== //
    // ============ Functions =============== //
    // ====================================== //
    function _getNumERC20Offers(TradeOffers storage self)
        internal
        view
        returns (uint256)
    {
        return self.erc20Offers.length;
    }

    /// REQUIRES msg.sender to first call approve/increaseAllowance for this MNG3R contract
    function _offerERC20ToFund(
        TradeOffers storage self,
        TradeOffer memory _tradeOffer
    ) public validOfferParams(_tradeOffer) {
        _tradeOffer.expirationTime =
            block.timestamp +
            _tradeOffer.expirationTime;

        // receive and hold offer (will return later if not accepted)
        IERC20Upgradeable token = IERC20Upgradeable(_tradeOffer.toMNG3RAsset);
        token.safeTransferFrom(
            msg.sender,
            address(this),
            _tradeOffer.toMNG3RAmtOrId[0]
        );

        // Update erc20Payable amount for this token
        self.erc20Payable[_tradeOffer.toMNG3RAsset] =
            self.erc20Payable[_tradeOffer.toMNG3RAsset] +
            _tradeOffer.toMNG3RAmtOrId[0];

        self.erc20Offers.push(_tradeOffer);

        emit ReceivedERC20TradeOffer(_tradeOffer);
    }

    /// Called to return tokens to maker of an expired offer
    function _returnExpiredERC20Offer(TradeOffers storage self, uint256 idx)
        public
    {
        require(idx < self.erc20Offers.length);

        TradeOffer memory offer = self.erc20Offers[idx];

        if (block.timestamp >= offer.expirationTime) {
            // return expired offer
            IERC20Upgradeable token = IERC20Upgradeable(offer.toMNG3RAsset);
            token.safeTransfer(offer.offerMaker, offer.toMNG3RAmtOrId[0]);

            // Update erc20Payable amount for this token
            self.erc20Payable[offer.toMNG3RAsset] =
                self.erc20Payable[offer.toMNG3RAsset] -
                offer.toMNG3RAmtOrId[0];

            // remove offer from record
            if (self.erc20Offers.length == 1) {
                self.erc20Offers.pop();
            } else {
                self.erc20Offers[idx] = self.erc20Offers[
                    self.erc20Offers.length - 1
                ];
                self.erc20Offers.pop();
            }
        } else {
            revert OfferNotExpired();
        }

        emit ReturnedERC20TradeOffer(offer);
    }

    function _acceptERC20Offer(
        TradeOffers storage self,
        uint256 idx,
        AssetType assetPayType
    ) public {
        require(idx < self.erc20Offers.length, "Invalid offer index");

        TradeOffer memory offer = self.erc20Offers[idx];
        require(block.timestamp < offer.expirationTime, "Offer has expired");

        // MNG3R PAYING WITH ERC20
        if (assetPayType == AssetType.erc20) {
            IMNG3R mng3r = IMNG3R(address(this));

            if (offer.fromMNG3RAsset == address(this)) {
                mng3r.mint(offer.offerMaker, offer.fromMNG3RAmtOrId[0]);
            } else {
                mng3r.erc20Transfer(
                    offer.fromMNG3RAsset,
                    offer.offerMaker,
                    offer.fromMNG3RAmtOrId[0]
                );
            }
        }

        // MNG3R PAYING WITH ERC721
        if (assetPayType == AssetType.erc721) {
            IMNG3R mng3r = IMNG3R(address(this));
            mng3r.erc721TransferFrom(
                offer.fromMNG3RAsset,
                offer.offerMaker,
                offer.fromMNG3RAmtOrId[0]
            );
        }

        // MNG3R PAYING WITH ERC1155
        if (
            assetPayType == AssetType.erc1155 &&
            offer.fromMNG3RAmtOrId.length == 1
        ) {
            IMNG3R mng3r = IMNG3R(address(this));
            mng3r.erc1155TransferFrom(
                offer.fromMNG3RAsset,
                offer.offerMaker,
                offer.fromMNG3RAmtOrId[0],
                offer.fromMNG3R1155Amt[0],
                "0x0"
            );
        }

        if (
            assetPayType == AssetType.erc1155 &&
            offer.fromMNG3RAmtOrId.length > 1
        ) {
            IMNG3R mng3r = IMNG3R(address(this));
            mng3r.erc1155BatchTransferFrom(
                offer.fromMNG3RAsset,
                offer.offerMaker,
                offer.fromMNG3RAmtOrId,
                offer.fromMNG3R1155Amt,
                "0x0"
            );
        }

        // Update erc20Payable amount for this token
        self.erc20Payable[offer.toMNG3RAsset] =
            self.erc20Payable[offer.toMNG3RAsset] -
            offer.toMNG3RAmtOrId[0];

        // remove offer from record
        if (self.erc20Offers.length == 1) {
            self.erc20Offers.pop();
        } else {
            self.erc20Offers[idx] = self.erc20Offers[
                self.erc20Offers.length - 1
            ];
            self.erc20Offers.pop();
        }

        emit AcceptedERC20TradeOffer(offer);
    }
}
