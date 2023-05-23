// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
    address public arbiter;
    address public beneficiary;
    address public depositor;

    bool public isApproved;

    event ApprovedEscrow(
        address indexed arbiter,
        address indexed beneficiary,
        address indexed depositor
    );
    event ContractDeployed(
        address indexed deployer,
        address indexed arbiter,
        address indexed beneficiary,
        uint256 value
    );

    constructor(address _arbiter, address _beneficiary) payable {
        arbiter = _arbiter;
        beneficiary = _beneficiary;
        depositor = msg.sender;

        emit ContractDeployed(
            depositor,
            arbiter,
            beneficiary,
            address(this).balance
        );
    }

    function approve() external {
        require(msg.sender == arbiter);

        uint balance = address(this).balance;

        (bool sent, ) = payable(beneficiary).call{value: balance}("");

        require(sent, "Failed to send Ether");

        emit ApprovedEscrow(arbiter, beneficiary, depositor);

        isApproved = true;
    }
}
