// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function directTransfer(address,address,uint256) external;
}


interface IPool {

    function flash(address,uint256,uint256,bytes calldata) external;
    function swap(address,bool,int256,uint160,bytes calldata) external returns (int256,int256);
    function slot0() external view returns (uint160 sqrtPriceX96,int24,uint16,uint16,uint16,uint8,bool);
    function token0() external returns(address);
    function token1() external returns(address);
     function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata
    ) external returns (uint256 amount0, uint256 amount1);

}

interface IWETH {
    function deposit() external payable;
}


library TransferHelper {
    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ST");
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {        
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'STF');
    }

}

contract SwapperTesting {

    IERC20 constant t0 = IERC20(0x1d4214081985ad20aa3cA93A2206aE792635cBec);
    IERC20 constant t1 = IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    function recurSwap(address _poolAddr, uint256 _myBal) public {
        IPool pool = IPool(_poolAddr);
        address swapperAddr = address(this);

        uint160 minSqrtRatio = 4295128740;
        uint i;
        uint256 myBal = _myBal;
        // 5 swaps in order to not spam to tracer
        for (i; i<5;) {
            // call swap function on the pool core UNIV3 contract
            pool.swap(swapperAddr, true, int256(myBal), minSqrtRatio, '');
            // transfer all the sent PNDX back after the swap
            t0.directTransfer(_poolAddr, swapperAddr, myBal);
            unchecked {
                ++i;
            }
        }
    }

    function uniswapV3SwapCallback(int256 amount0Delta,int256,bytes calldata) public payable {
        // repays PNDX after swap (since swapping t0 -> t1 (PNDX -> WETH), need to repay t0)
        t0.transfer(msg.sender, uint(amount0Delta));
    }

}