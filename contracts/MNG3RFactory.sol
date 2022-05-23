// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/IMNG3RGovernor.sol";
import "./interfaces/IMNG3R.sol";

/// @title Factory for MNG3R and MNG3R Gov contracts
/// @author Ledger West
/// @notice Use this contract to create your own MNG3R and MNG3R Gov contracts
/// @dev Blank
contract MNG3RFactory is Ownable, Pausable {
    // ====================================== //
    // =============== State ================ //
    // ====================================== //

    address immutable MNG3RImplementation;
    address immutable GovernorImplementation;

    /// @notice array of all deployed MNG3R instances
    address[] public deployedMNG3RList;

    /// @notice array of all deployed MNG3RGov instances
    address[] public deployedGovList;

    // ====================================== //
    // ============== Events ================ //
    // ====================================== //

    event NewMNG3R(
        address indexed newCoin,
        address indexed admin,
        string name,
        string symbol,
        uint256 supply
    );

    event NewMNG3RGovernor(
        address indexed gov,
        address indexed coin,
        string name
    );

    // ====================================== //
    // ============= Functions ============== //
    // ====================================== //

    /// @notice Factory constructor
    /// @param _MNG3RImplementation Address of deployed MNG3R implementation contract
    /// @param _GovernorImplementation Address of deployed MNG3R Governor implementation contract
    constructor(address _MNG3RImplementation, address _GovernorImplementation) {
        MNG3RImplementation = _MNG3RImplementation;
        GovernorImplementation = _GovernorImplementation;
    }

    /// @notice Deploys a new MNG3R and Governor contract for the caller
    /// @param _name name of your new MNG3R token
    /// @param _symbol symbol of your new MNG3R token
    /// @param _supply initial supply to mint to caller
    /// @param _delay initial vote delay for Gov (in blocks)
    /// @param _period initial vote period for Gov (in blocks)
    /// @param _thresh initial vote threshold for Gov proposal
    /// @return addresses of deployed MNG3R and Gov proxies
    function createNewMNG3R(
        string memory _name,
        string memory _symbol,
        uint256 _supply,
        uint256 _delay,
        uint256 _period,
        uint256 _thresh
    ) public whenNotPaused returns (address, address) {
        // deploy MNG3R
        address mng3rClone = Clones.clone(MNG3RImplementation);

        IMNG3R(mng3rClone).initialize(msg.sender, _name, _symbol, _supply);
        emit NewMNG3R(mng3rClone, msg.sender, _name, _symbol, _supply);

        deployedMNG3RList.push(mng3rClone);

        // deploy Governor
        address govClone = Clones.clone(GovernorImplementation);

        IMNG3RGovernor(govClone).initialize(
            mng3rClone,
            _name,
            _delay,
            _period,
            _thresh
        );
        emit NewMNG3RGovernor(govClone, mng3rClone, _name);

        deployedGovList.push(govClone);

        return (mng3rClone, govClone);
    }

    /// @notice Get a list of deployed MNG3R addresses
    /// @return Array of deployed MNG3R addresses
    function getDeployedMNG3Rs() public view returns (address[] memory) {
        return deployedMNG3RList;
    }

    /// @notice Get a list of deployed MNG3R Gov addresses
    /// @return Array of deployed MNG3R Gov addresses
    function getDeployedGovs() public view returns (address[] memory) {
        return deployedGovList;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
