/**
 * intToHexArray
 *
 * @param {number} int - the number to be converted to hex
 * @param {number)} size - the desired width of the hex value. will pad.
 *
 * @returns {string[]}
 */
export const intToHexArray = (int: number, size: number): string[] => {
  const hex: string[] = [];
  const hexRep: string[] = [];
  const hexVal = int.toString(16);

  // TODO: this really needs to be refactored.
  for (let i = 0; i < hexVal.length; i++) {
    hexRep[i] = hexVal[i].toString();
  }

  for (let i = 0; i < size - hexVal.length; i++) {
    hex.push('0');
  }

  for (let i = 0; i < hexVal.length; i++) {
    hex.push(hexRep[i]);
  }

  return hex;
};

/**
 * hexToIntArray
 *
 * @param {string} hex
 * @returns {number[]}
 */
export const hexToIntArray = (hex: string): number[] => {
  if (!hex || !isHex(hex)) {
    return [];
  }

  let res = [];

  for (let i = 0; i < hex.length; i++) {
    let c = hex.charCodeAt(i);
    let hi = c >> 8;
    let lo = c & 0xff;

    hi ? res.push(hi, lo) : res.push(lo);
  }

  return res;
};

/**
 * isHex
 *
 * @param {string} str - string to be tested
 * @returns {boolean}
 */
export const isHex = (str: string): boolean => {
  const plain = str.replace('0x', '');
  return /[0-9a-f]*$/i.test(plain);
};
