/**
 * Create an object composed of the picked object properties
 * @example
 * const obj = {
 *   id: 1,
 *   name: 'A',
 * }
 * pick(obj, ['name']) // output: { name: 'A' }
 *
 * pick(obj, ['name', 'idd']) // output: { name: 'A' }
 */

export function pick<T, K extends keyof T>(obj: T, keys: K[]) {
  return keys.reduce((acc, val) => {
    if (Object.prototype.hasOwnProperty.call(obj, val)) {
      acc[val] = obj[val];
    }
    return acc;
  }, {} as Pick<T, K>);
}
