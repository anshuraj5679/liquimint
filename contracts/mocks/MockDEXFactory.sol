// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockPair.sol";

contract MockDEXFactory {
    mapping(address => mapping(address => address)) public getPair;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "PAIR_EXISTS");

        MockPair lp = new MockPair(token0, token1);
        pair = address(lp);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
    }
}
