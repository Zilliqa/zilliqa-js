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

import { decode } from '../src/bech32';

const VALID_CHECKSUM = [
  'A12UEL5L',
  'an83characterlonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1tt5tgs',
  'abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw',
  '11qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc8247j',
  'split1checkupstagehandshakeupstreamerranterredcaperred2y9e3w',
];

const INVALID_CHECKSUM = [
  ' 1nwldj5',
  '\x7F' + '1axkwrx',
  'an84characterslonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1569pvx',
  'pzry9x0s0muk',
  '1pzry9x0s0muk',
  'x1b4n0q5v',
  'li1dgmt3',
  'de1lg7wt' + '\xFF',
];

describe('bech32 encoding', () => {
  it('should decode valid checksums', () => {
    VALID_CHECKSUM.forEach((encoded) => {
      expect(!!decode(encoded)).toBeTruthy();
    });
  });

  it('should not decode invalid checksums', () => {
    INVALID_CHECKSUM.forEach((encoded) => {
      expect(decode(encoded)).toBe(null);
    });
  });
});
