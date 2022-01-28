//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Adapted from https://github.com/ethjs/ethjs-unit/blob/master/src/index.js
 */
import BN from 'bn.js';

export enum Units {
  Zil = 'zil',
  Li = 'li',
  Qa = 'qa',
}

interface Options {
  pad: boolean;
}

const DEFAULT_OPTIONS = {
  pad: false,
};

const unitMap = new Map<Units, string>([
  [Units.Qa, '1'],
  [Units.Li, '1000000'], // 1e6 qa
  [Units.Zil, '1000000000000'], // 1e12 qa
]);

const numToStr = (input: string | number | BN) => {
  if (typeof input === 'string') {
    if (!input.match(/^-?[0-9.]+$/)) {
      throw new Error(
        `while converting number to string, invalid number value '${input}', should be a number matching (^-?[0-9.]+).`,
      );
    }
    return input;
  } else if (typeof input === 'number') {
    return String(input);
  } else if (BN.isBN(input)) {
    return input.toString(10);
  }

  throw new Error(
    `while converting number to string, invalid number value '${input}' type ${typeof input}.`,
  );
};

export const fromQa = (
  qa: BN,
  unit: Units,
  options: Options = DEFAULT_OPTIONS,
): string => {
  if (unit === 'qa') {
    return qa.toString(10);
  }

  const baseStr = unitMap.get(unit);

  if (!baseStr) {
    throw new Error(`No unit of type ${unit} exists.`);
  }

  const base = new BN(baseStr, 10);
  const baseNumDecimals = baseStr.length - 1;

  let fraction = qa.abs().mod(base).toString(10);

  // prepend 0s to the fraction half
  while (fraction.length < baseNumDecimals) {
    fraction = `0${fraction}`;
  }

  if (!options.pad) {
    fraction = <string>(
      (<RegExpMatchArray>fraction.match(/^([0-9]*[1-9]|0)(0*)/))[1]
    );
  }

  const whole = qa.div(base).toString(10);

  return fraction === '0' ? `${whole}` : `${whole}.${fraction}`;
};

export const toQa = (input: string | number | BN, unit: Units) => {
  let inputStr = numToStr(input);
  const baseStr = unitMap.get(unit);

  if (!baseStr) {
    throw new Error(`No unit of type ${unit} exists.`);
  }

  const baseNumDecimals = baseStr.length - 1;
  const base = new BN(baseStr, 10);

  // Is it negative?
  const isNegative = inputStr.substring(0, 1) === '-';
  if (isNegative) {
    inputStr = inputStr.substring(1);
  }

  if (inputStr === '.') {
    throw new Error(`Cannot convert ${inputStr} to Qa.`);
  }

  // Split it into a whole and fractional part
  const comps = inputStr.split('.'); // eslint-disable-line
  if (comps.length > 2) {
    throw new Error(`Cannot convert ${inputStr} to Qa.`);
  }

  let [whole, fraction] = comps;

  if (!whole) {
    whole = '0';
  }
  if (!fraction) {
    fraction = '0';
  }
  if (fraction.length > baseNumDecimals) {
    throw new Error(`Cannot convert ${inputStr} to Qa.`);
  }

  while (fraction.length < baseNumDecimals) {
    fraction += '0';
  }

  const wholeBN = new BN(whole);
  const fractionBN = new BN(fraction);
  let wei = wholeBN.mul(base).add(fractionBN); // eslint-disable-line

  if (isNegative) {
    wei = wei.neg();
  }

  return new BN(wei.toString(10), 10);
};
