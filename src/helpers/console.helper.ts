import { renderTimeSec, sortField, sortOrder } from "../config.const";

export function renderOutput(walletOutputDataArr) {
  setInterval(() => printWalletsInfo(walletOutputDataArr), renderTimeSec * 1000);
}

const sortByKey = <K extends string, T extends Record<string | K, any>>(
  array: T[],
  key: K,
  order: string
): T[] => {
  return array.slice().sort((a, b) => {
    if (a[key] < b[key]) return order === "asc" ? 1 : -1;

    if (a[key] > b[key]) return order === "asc" ? -1 : 1;

    return 0;
  });
};

export default sortByKey;


function printWalletsInfo(walletOutputDataArr) {
  console.clear();

  const sortedList = sortField && sortOrder ?
    sortByKey(walletOutputDataArr, sortField, sortOrder) 
    : walletOutputDataArr

  console.table(sortedList);
  isProgramCompleted(walletOutputDataArr);
}

function isProgramCompleted(walletOutputDataArr) {
  for (let i = 0; i < walletOutputDataArr.length; i++) {
    if (walletOutputDataArr[i].status === 0) return;
  }
  process.exit();
}
