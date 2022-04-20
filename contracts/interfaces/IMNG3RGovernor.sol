// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMNG3RGovernor {
    function initialize(
        address _token,
        string memory _name,
        uint256 _delay,
        uint256 _period,
        uint256 _thresh
    ) external;
}
