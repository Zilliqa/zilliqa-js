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

import { ReqMiddlewareFn, RPCMethod } from '@zilliqa-js/core';
import { bytes, validation } from '@zilliqa-js/util';
import { ZilliqaMessage } from '@zilliqa-js/proto';
import { TxReceipt, TxParams } from './types';

export const encodeTransactionProto = (tx: TxParams): Buffer => {
  const msg = {
    version: tx.version,
    nonce: tx.nonce || 0,
    // core protocol Schnorr expects lowercase, non-prefixed address.
    toaddr: bytes.hexToByteArray(tx.toAddr.replace('0x', '').toLowerCase()),
    senderpubkey: ZilliqaMessage.ByteArray.create({
      data: bytes.hexToByteArray(tx.pubKey || '00'),
    }),
    amount: ZilliqaMessage.ByteArray.create({
      data: Uint8Array.from(tx.amount.toArrayLike(Buffer, undefined, 16)),
    }),
    gasprice: ZilliqaMessage.ByteArray.create({
      data: Uint8Array.from(tx.gasPrice.toArrayLike(Buffer, undefined, 16)),
    }),
    gaslimit: tx.gasLimit,
    code:
      tx.code && tx.code.length
        ? Uint8Array.from([...tx.code].map((c) => <number>c.charCodeAt(0)))
        : null,
    data:
      tx.data && tx.data.length
        ? Uint8Array.from([...tx.data].map((c) => <number>c.charCodeAt(0)))
        : null,
  };

  const serialised = ZilliqaMessage.ProtoTransactionCoreInfo.create(msg);

  return Buffer.from(
    ZilliqaMessage.ProtoTransactionCoreInfo.encode(serialised).finish(),
  );
};

export const isTxReceipt = (x: unknown): x is TxReceipt => {
  return validation.isPlainObject(x) && validation.matchesObject(x, {});
};

export const isTxParams = (obj: unknown): obj is TxParams => {
  const validator = {
    version: [validation.required(validation.isNumber)],
    toAddr: [validation.required(validation.isAddress)],
    amount: [validation.required(validation.isBN)],
    gasPrice: [validation.required(validation.isBN)],
    gasLimit: [validation.required(validation.isLong)],
    code: [validation.isString],
    data: [validation.isString],
    receipt: [isTxReceipt],
    nonce: [validation.required(validation.isNumber)],
    signature: [validation.required(validation.isSignature)],
  };

  return validation.matchesObject(obj, validator);
};

export const formatOutgoingTx: ReqMiddlewareFn<[TxParams]> = (req) => {
  // if batch create transaction, payload is array
  if (
    Array.isArray(req.payload) &&
    req.payload[0].method === RPCMethod.CreateTransaction &&
    isTxParams(req.payload[0].params[0])
  ) {
    // loop thru batch payloads and format the params
    const payloads = [];
    for (const txPayload of req.payload) {
      const txConfig = txPayload.params[0];
      payloads.push({
        ...txPayload,
        params: [
          {
            ...txConfig,
            amount: txConfig.amount.toString(),
            gasLimit: txConfig.gasLimit.toString(),
            gasPrice: txConfig.gasPrice.toString(),
          },
        ],
      });
    }

    const ret = {
      ...req,
      payload: payloads,
    };

    return ret;
  }

  // non-batch create transactions
  if (
    !Array.isArray(req.payload) &&
    req.payload.method === RPCMethod.CreateTransaction &&
    isTxParams(req.payload.params[0])
  ) {
    const txConfig = req.payload.params[0];

    const ret = {
      ...req,
      payload: {
        ...req.payload,
        params: [
          {
            ...txConfig,
            amount: txConfig.amount.toString(),
            gasLimit: txConfig.gasLimit.toString(),
            gasPrice: txConfig.gasPrice.toString(),
          },
        ],
      },
    };

    return ret;
  }

  return req;
};

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), ms);
  });
}
