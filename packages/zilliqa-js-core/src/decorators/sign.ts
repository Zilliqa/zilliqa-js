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

import { Signable, ZilliqaModule } from '../types';

/**
 * sign
 *
 * This decorates a method by attempting to sign the first argument of the
 * intercepted method.
 *
 * @param {T} target
 * @param {K} key
 * @param {PropertyDescriptor} descriptor
 * @returns {PropertyDescriptor | undefined}
 */
export const sign = <T, K extends keyof T>(
  target: T,
  key: K,
  descriptor: PropertyDescriptor,
) => {
  const original = descriptor.value;

  async function interceptor(
    this: ZilliqaModule,
    arg: Signable,
    ...args: any[]
  ) {
    if (original && arg.bytes) {
      const signed = await this.signer.sign(arg);
      return original.call(this, signed, ...args);
    }
  }

  descriptor.value = interceptor;
  return descriptor;
};
