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
 * randomBytes
 *
 * Uses JS-native CSPRNG to generate a specified number of bytes.
 * NOTE: this method throws if no PRNG is available.
 *
 * @param {number} bytes
 * @returns {string}
 */

import randbytes from 'sodium-randbytes';

export const randomBytes = (bytes: number) => {
  // For node enviroment, use sodium-native because we prefer kernel CSPRNG.
  // References:
  // - https://paragonie.com/blog/2016/05/how-generate-secure-random-numbers-in-various-programming-languages#nodejs-csprng
  // - https://github.com/nodejs/node/issues/5798
  const b = randbytes(bytes);
  return b.toString('hex');
};
