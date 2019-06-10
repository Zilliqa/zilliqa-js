import { ReqMiddlewareFn, RPCMethod } from '@zilliqa-js/core';
import { bytes, validation } from '@zilliqa-js/util';
import { ZilliqaMessage } from '@zilliqa-js/proto';
import { uuid } from '@zilliqa-js/crypto';
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
  if (
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
    setTimeout(() => resolve(), ms);
  });
}

export interface EventLog {
  logId: string;
  eventName: string;
  data?: any;
  message?: any;
  timeStamp: string;
}

export const eventLog = (
  eventName: string,
  data?: any,
  message?: any,
): EventLog => {
  return {
    eventName,
    data,
    message,
    logId: uuid.v4(),
    timeStamp: new Date().toUTCString(),
  };
};
