//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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

import { decodeBase58, encodeBase58, normalizePrivateKey } from '../src/util';
import testCases from './b58.fixtures.json';

describe('crypto utils', () => {
  it('should encode base 16 strings in base 58 correctly', () => {
    testCases.forEach(([input, expected]) => {
      const actual = encodeBase58(input);
      expect(actual).toEqual(expected);
    });
  });

  it('should decode base 58 strings to base 16 correctly', () => {
    testCases.forEach(([expected, input]) => {
      const actual = decodeBase58(input);
      expect(actual).toEqual(expected);
    });
  });

  it('should encode and decode to the same strings', () => {
    const b16 = 'fa629547ab288cdd7f726fc0610abe944c982a1d';
    const b58 = encodeBase58(b16);
    expect(decodeBase58(b58)).toEqual(b16);
  });

  it('should normalise private keys with 0x prefix', () => {
    const noPrefix =
      'af71626e38926401a6d2fd8fdf91c97f785b8fb2b867e7f8a884351e59ee9aa6';
    const withPrefix =
      '0xaf71626e38926401a6d2fd8fdf91c97f785b8fb2b867e7f8a884351e59ee9aa6';
    expect(noPrefix).toEqual(normalizePrivateKey(withPrefix));
  });
});
