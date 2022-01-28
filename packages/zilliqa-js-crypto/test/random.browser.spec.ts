/**
 * @jest-environment jsdom
 */

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

import { randomBytes } from '../src/random';

describe('random', () => {
  it('should use window.crypto.getRandomValues for browsers', () => {
    const originBuffer = { ...global.Buffer };
    const mockAllocUnsafe = () => originBuffer.allocUnsafe(16).fill(0);
    Object.defineProperty(global, 'Buffer', {
      value: {
        allocUnsafe: mockAllocUnsafe,
      },
    });

    const mockFn = jest.fn();
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: mockFn,
      },
    });

    const want = '00000000000000000000000000000000';
    expect(randomBytes(16)).toEqual(want);
    expect(mockFn.mock.calls.length).toEqual(1);
  });
});
