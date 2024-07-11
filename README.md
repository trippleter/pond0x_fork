# Sample Hardhat Froking with Traces

This code simulates a transaction on an Ethereum Mainnet fork and shows call traces.

A bit of context: there is a project called Pond0x (https://x.com/Pond0x). They created an unsuccessful token PNDX (https://etherscan.io/address/0x1d4214081985ad20aa3cA93A2206aE792635cBec)
The reason was that it had a directTransfer function, which allowed to transfer any amount of tokens from any wallet (lacked an msg.sender == owner check). 
I saw a potential opportunity: some UNIV3 pools still contained WETH inside (e.g. https://dexscreener.com/ethereum/0x702747ac260E54B5511c311610c5E55951E47406 still has 1.4 ETH inside)
So, I found an arbitrage opportunity: what if I take the majority of supply from top holders and call the swap function on the poolAddress.

Thus, this code creates a simple contract that transfers PNDX from top holder of (46% of the total supply), and loop-swaps the acquired tokens. 
It uses a fork of Ethereum Mainnet to test if it actually works with the given pool reserves. (spoiler: the price is too low)

First install Harhdat and Tracer:
```
npm i hardhat
npm i hardhat-tracer
```

TO RUN WITH TRACES CALL:
```
npx hardhat test --trace   
```

TO RUN WITHOUT TRACES CALL:

```
npx hardhat run scripts/pond0x_no_tracing.js
```

(ankr public node is used in config)



