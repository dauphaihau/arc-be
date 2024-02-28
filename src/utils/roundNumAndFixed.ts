
/*
 * Rounding a number to exactly two decimal places for currency formatting
 */
export const roundNumAndFixed = (num: number): number => {
  return Number((Math.round(num * 100) / 100).toFixed(2));
};
