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

import { TxParams } from '@zilliqa-js/account';
import {
  RPCResponse,
  TransactionError,
  TransactionObj,
} from '@zilliqa-js/core';
import { toChecksumAddress } from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

export function toTxParams(
  response: RPCResponse<TransactionObj, never>,
): TxParams {
  const {
    toAddr,
    senderPubKey,
    gasPrice,
    gasLimit,
    nonce,
    amount,
    receipt,
    version,
    code,
    data,
    ...rest
  } = <TransactionObj>response.result;

  const msg = receipt.errors
    ? Object.keys(receipt.errors).reduce((acc, depth) => {
        const errorMsgList = receipt.errors[depth].map(
          (num: number) => TransactionError[num],
        );
        return { ...acc, [depth]: errorMsgList };
      }, {})
    : {};

  return {
    ...rest,
    version: parseInt(version, 10),
    toAddr: toChecksumAddress(toAddr),
    pubKey: senderPubKey.replace('0x', ''),
    gasPrice: new BN(gasPrice),
    gasLimit: Long.fromString(gasLimit, 10),
    amount: new BN(amount),
    nonce: parseInt(nonce, 10),
    code,
    data,
    receipt: {
      ...receipt,
      accepted: receipt.accepted,
      errors: msg,
      cumulative_gas: parseInt(receipt.cumulative_gas, 10),
    },
  };
}
