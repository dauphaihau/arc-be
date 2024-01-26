export function deepEqualObjects(object1: object, object2: object) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    const val1 = object1[key as keyof object];
    const val2 = object2[key as keyof object];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      (areObjects && !deepEqualObjects(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false;
    }
  }
  return true;
}

function isObject(object: object) {
  return object != null && typeof object === 'object';
}
