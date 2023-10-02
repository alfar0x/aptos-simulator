## Functionality:

- Swap with Liquidswap
- Buy/Sell/Relist of the cheap NFTs on Bluemove
- Stake / Unstake on Tortuga and DittoFi
- Everything is randomized, only needed APT on the wallet.

## Installation:

1. Install Node.js => [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. Create Aptos Wallets and fund them (0.4 APT and more is preferred). Creation could be done with [https://cointool.app/createWallet/aptos](https://cointool.app/createWallet/aptos)
3. Put your private keys in the `privates.txt` file in the root of the folder
4. Create `.env` file in the root folder and provide variables using example file `.env.example` 
5. Run `npm install` to install dependencies
6. Change config (optional) in src/config.const.ts file.
    **sleepBeforeStartAccountMin** - minimum delay before start account transactions
    **sleepBeforeStartAccountMax** - maximum delay before start account transactions
    For example, if you specified sleepBeforeStartAccountMin = 240 and txAmountMax = 360, then each wallet will start working in the range from 4 to 6 minutes

    **txAmountMin** - minimum desired number of transactions per wallet per session
    **txAmountMax** - maximum desired number of transactions per wallet per session
    For example, if you specified txAmountMin = 2 and txAmountMax = 4, then a random number of transactions from 2 to 4 will be performed on each wallet

    **sleepBetweenTransactionsMin** - minimum delay between each transaction in seconds
    **sleepBetweenTransactionsMax** - maximum delay between each transaction in seconds
    For example, if you specified timeSleepMin = 120 and timeSleepMax = 300, then on each the delay between each transaction will be randomly selected in the range from 2 to 5 minutes


    **sortField** - sort field from table like `next_step_time` or `end_time`. Leave empty to sort as in `privates.txt` file
    **sortOrder** - `asc` or `desc`

    **renderTimeSec** - terminal render table time (seconds)
7. Run `npm run start`


## Console fields:

**index -** serial number of your wallet from .txt file

**address -** wallet address

**progress -** how many transactions have been made out of the total for a particular wallet

**current_step_type -** current transaction type (NFT action / DEX trading / liquid staking action)

**last_step_result -** the result of the last transaction

It can be of three types:

1. Success - everything is ok
2. Error when creating a TX - this happens if, for example, an action with nft fell out, but the collection for purchase was not found
3. Fail - this happens extremely rarely, for example, when someone bought the selected NFT during the formation and sending of the transaction

**next_step_time -** Shows when next transaction will be run

**end_time -** Shows when all actions when be performed (blockchain transaction is not included in calculation)

**status -** if 0 then the wallet has not yet completed the session, if 1 then completed


### Reach me out, tg: @humansimulacrum if help is needed!