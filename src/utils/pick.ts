/**
 * Create an object composed of the picked object properties
 */
type NewObject = {
  [index: string]: unknown;
};

export const pick = <T>(objectToPick: T, keys: string[]): NewObject => {
  return keys.reduce((newObj: NewObject, key) => {
    if (objectToPick && Object.prototype.hasOwnProperty.call(objectToPick, key)) {
      newObj[key] = objectToPick[key as keyof object];
    }
    return newObj;
  }, {});
};
