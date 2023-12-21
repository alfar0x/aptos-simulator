export const sleepBeforeStartAccountSecMin = 10;
export const sleepBeforeStartAccountSecMax = 60 * 60 * 60;

export const txAmountMin = 40;
export const txAmountMax = 80;

export const sleepBetweenTransactionsSecMin = 60 * 10;
export const sleepBetweenTransactionsSecMax = 60 * 60 * 30;

export const sortField = 'next_step_time';
export const sortOrder = 'desc'

export const renderTimeSec = 10 * 60

export const sellCollectionNamesBlacklist = ['Galxe OAT', 'Aptos Names V1'];

export const minAptCashBalanceToSwapIt = 5

export const TX_TYPES = [
  1, // SWAP
  // 2, // NFT
  // 3, // STAKE
]