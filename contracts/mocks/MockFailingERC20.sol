// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockFailingERC20 is ERC20 {
    bool public failTransfer;
    bool public failTransferFrom;

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setFailTransfer(bool shouldFail) external {
        failTransfer = shouldFail;
    }

    function setFailTransferFrom(bool shouldFail) external {
        failTransferFrom = shouldFail;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (failTransfer) {
            return false;
        }
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (failTransferFrom) {
            return false;
        }
        return super.transferFrom(from, to, amount);
    }
}
