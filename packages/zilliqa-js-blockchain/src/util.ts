//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { TxParams } from '@zilliqa-js/account';
import {
  RPCResponse,
  TransactionError,
  TransactionErrorMessageObj,
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

  const msg: TransactionErrorMessageObj = {};
  if (receipt.errors) {
    const messageList: string[] = [];
    const errList = Object.values(receipt.errors).flat(2);
    const errDepth = Object.keys(receipt.errors);
    for (const errCode of errList) {
      messageList.push(TransactionError[errCode]);
    }
    msg[+errDepth[0]] = messageList;
  }

  return {
    ...rest,
    version: parseInt(version, 10),
    toAddr: toChecksumAddress(toAddr),
    pubKey: senderPubKey.replace('0x', ''),
    gasPrice: new BN(gasPrice),
    gasLimit: Long.fromString(gasLimit, 10),
    amount: new BN(amount),
    nonce: parseInt(nonce, 10),
    receipt: {
      ...receipt,
      errors: msg,
      cumulative_gas: parseInt(receipt.cumulative_gas, 10),
    },
  };
}
