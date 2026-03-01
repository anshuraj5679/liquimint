// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockDEXFactory.sol";
import "./MockPair.sol";

contract MockDEXRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _weth) {
        factory = _factory;
        WETH = _weth;
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint, // amountTokenMin
        uint, // amountETHMin
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        require(block.timestamp <= deadline, "EXPIRED");
        require(msg.value > 0, "NO_ETH");
        require(amountTokenDesired > 0, "NO_TOKEN");

        address pair = MockDEXFactory(factory).getPair(token, WETH);
        if (pair == address(0)) {
            pair = MockDEXFactory(factory).createPair(token, WETH);
        }

        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        liquidity = amountTokenDesired < msg.value ? amountTokenDesired : msg.value;
        MockPair(pair).mint(to, liquidity);

        return (amountTokenDesired, msg.value, liquidity);
    }

    function removeLiquidityETH(
        address,
        uint,
        uint,
        uint,
        address,
        uint
    ) external pure returns (uint, uint) {
        revert("NOT_IMPLEMENTED");
    }
}
