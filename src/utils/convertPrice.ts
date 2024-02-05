import Big from 'big.js';

export const convertPrice = (value: number): number => {
  return Number(Big(value).toFixed(2));
};
