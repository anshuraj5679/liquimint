// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPair is ERC20 {
    address public immutable token0;
    address public immutable token1;

    constructor(address _token0, address _token1) ERC20("Mock LP", "MLP") {
        token0 = _token0;
        token1 = _token1;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
