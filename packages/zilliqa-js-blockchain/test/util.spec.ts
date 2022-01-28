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

import { Transaction } from '@zilliqa-js/account';
import { toTxParams } from '../src/util';

describe('blockchain utils', () => {
  it('toTxParams should handle non-checksummed response from RPC', () => {
    const address = '1a90c25307c3cc71958a83fa213a2362d859cf33';
    const mockResponse = {
      id: 1,
      jsonrpc: '2.0',
      error: undefined,
      result: {
        ID: '',
        signature: '',
        toAddr: address,
        senderPubKey:
          '034c39363529c2d4078f72b8c498c4cbc5ba5e10d8666fe06f104a27e0e44242a0',
        gasPrice: '1000000000',
        gasLimit: '1',
        nonce: '8',
        amount: '1000000000000',
        receipt: {
          cumulative_gas: '1000',
          success: true,
          event_logs: [],
        },
        version: '65537',
      },
    };

    // @ts-ignore
    expect(() => new Transaction(toTxParams(mockResponse))).not.toThrow();
  });
});
