// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Crowdfunding
 * @notice Decentralized crowdfunding smart contract with admin ownership.
 * The deployer is automatically set as the initial admin/owner.
 */
contract Crowdfunding is Ownable {
    /**
     * @notice Initializes the contract and assigns the deployer (msg.sender) as the initial owner.
     */
    constructor() Ownable(msg.sender) {}
}
