// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract XReserve {
    event DepositToRemote(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint32 remoteDomain,
        bytes32 remoteRecipient
    );

    function depositToRemote(
        uint256 value,
        uint32 remoteDomain,
        bytes32 remoteRecipient,
        address localToken,
        uint256, /* maxFee */
        bytes calldata /* hookData */
    ) external {
        require(value > 0, "amount=0");
        require(remoteRecipient != bytes32(0), "bad recipient");

        IERC20(localToken).transferFrom(
            msg.sender,
            address(this),
            value
        );

        emit DepositToRemote(
            msg.sender,
            localToken,
            value,
            remoteDomain,
            remoteRecipient
        );
    }
}
