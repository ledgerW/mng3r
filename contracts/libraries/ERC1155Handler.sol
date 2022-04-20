// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import "../interfaces/IMNG3R.sol";
import {TradeOffer, TradeOffers, AssetType} from "../interfaces/IMNG3R.sol";

/// @title ERC1155 libary for MNG3R contract
/// @author Ledger West
/// @notice This library provides ERC1155 handling functionality for MNG3R
library ERC1155Handler {
    // ====================================== //
    // ========== Events & Errors =========== //
    // ====================================== //
    event ReceivedERC1155TradeOffer(TradeOffer _tradeOffer);
    event ReturnedERC1155TradeOffer(TradeOffer _tradeOffer);
    event AcceptedERC1155TradeOffer(TradeOffer _tradeOffer);

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
    function _getNumERC1155Offers(TradeOffers storage self)
        internal
        view
        returns (uint256)
    {
        return self.erc1155Offers.length;
    }

    /// REQUIRES msg.sender to first call approve/increaseAllowance for this MNG3R contract
    function _offerERC1155ToFund(
        TradeOffers storage self,
        TradeOffer memory _tradeOffer
    ) public validOfferParams(_tradeOffer) {
        _tradeOffer.expirationTime =
            block.timestamp +
            _tradeOffer.expirationTime;

        // receive and hold offer (will return later if not accepted)
        IERC1155Upgradeable token = IERC1155Upgradeable(
            _tradeOffer.toMNG3RAsset
        );
        if (_tradeOffer.toMNG3RAmtOrId.length == 1) {
            token.safeTransferFrom(
                msg.sender,
                address(this),
                _tradeOffer.toMNG3RAmtOrId[0],
                _tradeOffer.toMNG3R1155Amt[0],
                "0x0"
            );
        } else {
            token.safeBatchTransferFrom(
                msg.sender,
                address(this),
                _tradeOffer.toMNG3RAmtOrId,
                _tradeOffer.toMNG3R1155Amt,
                "0x0"
            );
        }

        // Update erc1155Payable amount for this token
        for (uint256 id = 0; id < _tradeOffer.toMNG3RAmtOrId.length; id++) {
            self.erc1155Payable[_tradeOffer.toMNG3RAsset][
                _tradeOffer.toMNG3RAmtOrId[id]
            ] =
                self.erc1155Payable[_tradeOffer.toMNG3RAsset][
                    _tradeOffer.toMNG3RAmtOrId[id]
                ] +
                _tradeOffer.toMNG3R1155Amt[id];
        }

        self.erc1155Offers.push(_tradeOffer);

        emit ReceivedERC1155TradeOffer(_tradeOffer);
    }

    /// Called to return tokens to maker of an expired offer
    function _returnExpiredERC1155Offer(TradeOffers storage self, uint256 idx)
        public
    {
        require(idx < self.erc1155Offers.length);

        TradeOffer memory offer = self.erc1155Offers[idx];

        if (block.timestamp >= offer.expirationTime) {
            // return expired offer
            IERC1155Upgradeable token = IERC1155Upgradeable(offer.toMNG3RAsset);
            if (offer.toMNG3RAmtOrId.length == 1) {
                token.safeTransferFrom(
                    address(this),
                    offer.offerMaker,
                    offer.toMNG3RAmtOrId[0],
                    offer.toMNG3R1155Amt[0],
                    "0x0"
                );
            } else {
                token.safeBatchTransferFrom(
                    address(this),
                    offer.offerMaker,
                    offer.toMNG3RAmtOrId,
                    offer.toMNG3R1155Amt,
                    "0x0"
                );
            }

            // Update erc1155Payable amount for this token
            for (uint256 id = 0; id < offer.toMNG3RAmtOrId.length; id++) {
                self.erc1155Payable[offer.toMNG3RAsset][
                    offer.toMNG3RAmtOrId[id]
                ] =
                    self.erc1155Payable[offer.toMNG3RAsset][
                        offer.toMNG3RAmtOrId[id]
                    ] -
                    offer.toMNG3R1155Amt[id];
            }

            // remove offer from record
            if (self.erc1155Offers.length == 1) {
                self.erc1155Offers.pop();
            } else {
                self.erc1155Offers[idx] = self.erc1155Offers[
                    self.erc1155Offers.length - 1
                ];
                self.erc1155Offers.pop();
            }
        } else {
            revert OfferNotExpired();
        }

        emit ReturnedERC1155TradeOffer(offer);
    }

    function _acceptERC1155Offer(
        TradeOffers storage self,
        uint256 idx,
        AssetType assetPayType
    ) public {
        require(idx < self.erc1155Offers.length, "Invalid offer index");

        TradeOffer memory offer = self.erc1155Offers[idx];
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

        // Update erc1155Payable amount for this token
        for (uint256 id = 0; id < offer.toMNG3RAmtOrId.length; id++) {
            self.erc1155Payable[offer.toMNG3RAsset][offer.toMNG3RAmtOrId[id]] =
                self.erc1155Payable[offer.toMNG3RAsset][
                    offer.toMNG3RAmtOrId[id]
                ] -
                offer.toMNG3R1155Amt[id];
        }

        // remove offer from record
        if (self.erc1155Offers.length == 1) {
            self.erc1155Offers.pop();
        } else {
            self.erc1155Offers[idx] = self.erc1155Offers[
                self.erc1155Offers.length - 1
            ];
            self.erc1155Offers.pop();
        }

        emit AcceptedERC1155TradeOffer(offer);
    }
}
