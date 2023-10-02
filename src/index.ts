import { AptosAccount, AptosClient, HexString } from 'aptos';

import { LiquidStakeModule } from './modules/stake.module';
import { NftModule } from './modules/nft.module';
import { SwapModule } from './modules/swap.module';

import {
  sleepBeforeStartAccountSecMin,
  sleepBeforeStartAccountSecMax,
  sleepBetweenTransactionsSecMin,
  sleepBetweenTransactionsSecMax,
  txAmountMax,
  txAmountMin,
} from './config.const';

import { tokenList } from './tokenList.const';
import { renderOutput } from './helpers/console.helper';
import { importWallets } from './helpers/file-import.helper';
import { env, generateShortString, getRandomInt, msToTimeString, sleep } from './helpers';

const client = new AptosClient(env.RPC_URL);

let walletOutputDataArr: WalletOutputData[] = [];

async function main() {
  const privateKeys = await importWallets();

  for (let i = 0; i < privateKeys.length; i++) {
    try {
      const aptosAccount = new AptosAccount(new HexString(privateKeys[i]).toUint8Array());
      await client.getAccountResources(aptosAccount.address());
    } catch (error) {
      console.log('Wrong private keys are entered or there are no funds on the wallet: ');
      console.log(i + ') ' + privateKeys[i]);
      return;
    }
  }

  for (let i = 0; i < privateKeys.length; i++) {
    const aptosAccount = new AptosAccount(new HexString(privateKeys[i]).toUint8Array());
    const address = aptosAccount.address().toString()

    walletOutputDataArr.push({
      address: generateShortString(address),
      progress: '0/0',
      current_step_type: '',
      last_step_result: '',
      next_step_time: '',
      end_time: '',
      status: 0,
    });

    const sleepBeforeStartSec = getRandomInt(sleepBeforeStartAccountSecMin, sleepBeforeStartAccountSecMax);

    session(
      getRandomInt(txAmountMin, txAmountMax),
      privateKeys[i],
      i,
      sleepBetweenTransactionsSecMax * 1000,
      sleepBetweenTransactionsSecMin * 1000,
      sleepBeforeStartSec * 1000
    );
  }

  renderOutput(walletOutputDataArr);
}

main();

async function session(
  txAmount: number,
  privateKey: string,
  walletID: number,
  timeSleepMin: number,
  timeSleepMax: number,
  sleepBeforeStart: number,
) {
  const dexTrader = new SwapModule(privateKey, client);
  const liquidStaker = new LiquidStakeModule(privateKey, client);
  const nftTrader = new NftModule(privateKey, client);

  const msDelayArr: number[] = [];
  let totalDelay = sleepBeforeStart;

  for (let i = 0; i < txAmount-1; i++) {
    const randomSleep = getRandomInt(timeSleepMin, timeSleepMax);
    msDelayArr.push(randomSleep);
    totalDelay += randomSleep;
  }

  const endTime = msToTimeString(totalDelay);

  walletOutputDataArr[walletID].end_time = endTime;
  walletOutputDataArr[walletID].progress = '0/' + txAmount;

  let totalTimeUntilEnd = totalDelay

  if (sleepBeforeStart) {
    walletOutputDataArr[walletID].current_step_type = 'sleeping before start';
    walletOutputDataArr[walletID].next_step_time = msToTimeString(sleepBeforeStart)

    await sleep(sleepBeforeStart);

    totalTimeUntilEnd = totalTimeUntilEnd - sleepBeforeStart

    walletOutputDataArr[walletID].end_time = msToTimeString(totalTimeUntilEnd)
  }

  for (let i = 0; i < txAmount; i++) {
    const txType:number = getRandomInt(1,3);
    let txHash = '';

    try{
      switch (txType) {
        case 1:
          walletOutputDataArr[walletID].current_step_type = 'DEX trading';
          txHash = await dexTrader.makeRandomSwap();
          break;
          
        case 2:
          walletOutputDataArr[walletID].current_step_type = 'NFT action';
          txHash = await nftTrader.makeRandomNftAction(tokenList[0].estimatedPriceInUsd);
          break;
          
        case 3:
          walletOutputDataArr[walletID].current_step_type = 'Liquid staking action';
          txHash = await liquidStaker.makeRandomStakeAction();
          break;
          
        default:
          break;
      }
              
    } catch (error){
      console.error((error as Error).message)
      txHash = 'error'
    }
            
    if(!txHash || txHash == 'error') {
      walletOutputDataArr[walletID].last_step_result = 'error';
    } else {
      const txResult = await client.waitForTransactionWithResult(txHash);
      
      const lastStepResult = (txResult as any)?.success ? 'Success' : 'Fail'

      walletOutputDataArr[walletID].last_step_result = lastStepResult;
    }

    walletOutputDataArr[walletID].progress = i + 1 + '/' + txAmount;
    
    const isLastStepDone = i >= txAmount - 1
    
    if(isLastStepDone) {
      walletOutputDataArr[walletID].next_step_time = 'done'
      walletOutputDataArr[walletID].end_time = new Date().toLocaleString()
    } else {
      walletOutputDataArr[walletID].next_step_time = msToTimeString(msDelayArr[i]);

      await sleep(msDelayArr[i]);
      
      totalTimeUntilEnd = totalTimeUntilEnd - msDelayArr[i]
      walletOutputDataArr[walletID].end_time = msToTimeString(totalTimeUntilEnd);
    }
  }
  walletOutputDataArr[walletID].status = 1;
}

declare type WalletOutputData = {
  address: string;
  progress: string;
  current_step_type: string;
  last_step_result: string;
  next_step_time: string;
  end_time: string;
  status: number;
};
