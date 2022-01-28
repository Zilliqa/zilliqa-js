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

import BN from 'bn.js';
import * as denom from '../src/unit';

describe('Unit utils', () => {
  it('should convert Qa to Zil', () => {
    const qa = new BN(1_000_000_000_000);
    const expected = '1';

    expect(denom.fromQa(qa, denom.Units.Zil)).toEqual(expected);
  });

  it('should convert Qa to Li', () => {
    const qa = new BN(1_000_000);
    const expected = '1';

    expect(denom.fromQa(qa, denom.Units.Li)).toEqual(expected);
  });

  it('should convert Li to Qa', () => {
    const li = new BN(1);
    const expected = new BN(1_000_000);

    expect(denom.toQa(li, denom.Units.Li).eq(expected)).toBeTruthy();
  });

  it('should convert Zil to Qa', () => {
    const zil = new BN(1);
    const expected = new BN(1_000_000_000_000);

    expect(denom.toQa(zil, denom.Units.Zil).eq(expected)).toBeTruthy();
  });

  it('fromQa should should work for negative numbers', () => {
    const qa = new BN(-1_000_000_000_000);
    const expected = '-1';

    expect(denom.fromQa(qa, denom.Units.Zil)).toEqual(expected);
  });

  it('toQa should should work for negative numbers', () => {
    const zil = new BN(-1);
    const expected = new BN(-1000000000000);

    expect(denom.toQa(zil, denom.Units.Zil)).toEqual(expected);
  });
});
