import { AptosAccount, AptosClient, HexString } from 'aptos';
import { Token, tokenList } from '../tokenList.const';
import { addHoursAndGetSeconds, calculatePercentage, getRandomInt, getTokenBalance, sleep } from '../helpers';
import { minAptCashBalanceToSwapIt } from '../config.const';

const LIQUID_SWAP_CONTRACT_ADDRESS = '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12';
const minCashInToken = 0.1

export class SwapModule {
  private privateKey: string;
  private hexPrivateKey: HexString;
  private account: AptosAccount;
  private walletAddress: HexString;
  private client: AptosClient;

  constructor(privateKey: string, client: AptosClient) {
    this.privateKey = privateKey;
    this.hexPrivateKey = new HexString(this.privateKey);
    this.account = new AptosAccount(this.hexPrivateKey.toUint8Array());
    this.walletAddress = this.account.address();
    this.client = client;
  }

  public async makeRandomSwap(): Promise<string> {
    let fromToken;
    let toToken;
    let amount;

    const accountTokens: Token[] = [];
    let isNativeTokenAllowedToSell = true;

    for (let i = 0; i < tokenList.length; i++) {
      const tokenBalance = await getTokenBalance(tokenList[i].address, this.account, this.client);
      const cashInToken = tokenList[i].estimatedPriceInUsd * (tokenBalance / 10 ** tokenList[i].decimals);
      console.log(tokenList[i].symbol, cashInToken)
      if (cashInToken > minCashInToken) accountTokens.push(tokenList[i]);
      if(tokenList[i].symbol === "APT" && cashInToken < Math.max(minCashInToken, minAptCashBalanceToSwapIt)) {
        isNativeTokenAllowedToSell = false
      }
    }
    
    if(accountTokens.length === 0) return 'no tokens to swap'

    const fromTokenList = isNativeTokenAllowedToSell 
      ? [...accountTokens] 
      : accountTokens.filter(t => t.symbol !== "APT")


    if(!isNativeTokenAllowedToSell && fromTokenList.length === 0) {
      return 'not tokens to swap in native'
    }

    fromToken = fromTokenList[getRandomInt(0, fromTokenList.length - 1)];

    const toTokenList = isNativeTokenAllowedToSell 
      ? tokenList.filter(t => t.address !== fromToken.address) 
      : tokenList.filter(t => t.symbol === "APT")

    toToken = toTokenList[getRandomInt(0, toTokenList.length - 1)];

    const fromTokenBalance = await getTokenBalance(fromToken.address, this.account, this.client);

    if (!isNativeTokenAllowedToSell) {
      amount = fromTokenBalance
    } else if (fromToken === tokenList[0]) {
      amount = getRandomInt(calculatePercentage(fromTokenBalance, 2), calculatePercentage(fromTokenBalance, 20));
    } else {
      amount = getRandomInt(calculatePercentage(fromTokenBalance, 10), calculatePercentage(fromTokenBalance, 100));
    }

    if (!accountTokens.includes(toToken)) {
      const regTokenTx = await this.registerToken(toToken);
      const txResult = ((await this.client.waitForTransactionWithResult(regTokenTx as string)) as any).success;
      if (!txResult) return 'tx res is null';
    }

    const sendedTxHash = await this.liquidSwap(fromToken, toToken, amount);
    return sendedTxHash;
  }

  public async registerToken(token: Token): Promise<string> {
    const txPayload = this.getPayloadForRegisterToken(token);
    const max_gas_amount = await this.client.estimateMaxGasAmount(this.account.address());
    const options: Partial<SubmitTransactionRequest> = {
      max_gas_amount: max_gas_amount.toString(),
      expiration_timestamp_secs: addHoursAndGetSeconds(1).toString(),
    };
    const rawTX = await this.client.generateTransaction(this.walletAddress, txPayload, options);
    return await this.client.signAndSubmitTransaction(this.account, rawTX);
  }

  public async liquidSwap(fromToken: Token, toToken: Token, amount: number): Promise<string> {
    const txPayload = this.getPayloadForLiquidSwap(fromToken, toToken, amount);

    const max_gas_amount = await this.client.estimateMaxGasAmount(this.account.address());
    const options: Partial<SubmitTransactionRequest> = {
      max_gas_amount: max_gas_amount.toString(),
      expiration_timestamp_secs: addHoursAndGetSeconds(1).toString(),
    };

    const rawTX = await this.client.generateTransaction(this.walletAddress, txPayload, options);
    return this.client.signAndSubmitTransaction(this.account, rawTX);
  }

  private getPayloadForLiquidSwap(fromToken: Token, toToken: Token, amount: number): EntryFunctionPayload {
    const moveFunction = `${LIQUID_SWAP_CONTRACT_ADDRESS}::scripts_v2::swap`;

    const type_arguments = [
      fromToken.address,
      toToken.address,
      `${LIQUID_SWAP_CONTRACT_ADDRESS}::curves::Uncorrelated`,
    ];
    const _arguments = [amount.toString(), ''];

    return { function: moveFunction, type_arguments: type_arguments, arguments: _arguments };
  }

  private getPayloadForRegisterToken(token: Token): EntryFunctionPayload {
    const moveFunction = '0x1::managed_coin::register';
    const type_arguments = [token.address];
    const _arguments: string[] = [];
    return { function: moveFunction, type_arguments: type_arguments, arguments: _arguments };
  }
}

declare type EntryFunctionPayload = {
  function: string;
  type_arguments: Array<any>;
  arguments: Array<any>;
};

declare type SubmitTransactionRequest = {
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: TransactionPayload_EntryFunctionPayload;
  signature: TransactionSignature_Ed25519Signature;
};

declare type TransactionPayload_EntryFunctionPayload = {
  type: string;
} & EntryFunctionPayload;

declare type TransactionSignature_Ed25519Signature = {
  type: string;
} & Ed25519Signature$1;

declare type Ed25519Signature$1 = {
  public_key: string;
  signature: string;
};
