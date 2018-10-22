import {
  ReqMiddlewareFn,
  RPCRequest,
  RPCRequestPayload,
  RPCMethod,
} from '@zilliqa/zilliqa-js-core';
import {bytes, validation} from '@zilliqa/zilliqa-js-util';
import {TxReceipt, TxParams} from './types';
/**
 * encodeTransaction
 *
 * @param {TxParams} tx - JSON-encoded tx to convert to a byte array
 * @returns {Buffer} - Buffer of bytes
 */
export const encodeTransaction = (tx: TxParams): Buffer => {
  let codeHex = Buffer.from(tx.code || '').toString('hex');
  let dataHex = Buffer.from(tx.data || '').toString('hex');

  let encoded =
    bytes.intToHexArray(tx.version, 64).join('') +
    bytes.intToHexArray(tx.nonce || 0, 64).join('') +
    tx.to +
    tx.pubKey +
    tx.amount.toString('hex', 64) +
    tx.gasPrice.toString('hex', 64) +
    tx.gasLimit.toString('hex', 64) +
    bytes.intToHexArray((tx.code && tx.code.length) || 0, 8).join('') + // size of code
    codeHex +
    bytes.intToHexArray((tx.data && tx.data.length) || 0, 8).join('') + // size of data
    dataHex;

  return Buffer.from(encoded, 'hex');
};

export const isTxReceipt = (x: unknown): x is TxReceipt => {
  return validation.isPlainObject(x) && validation.matchesObject(x, {});
};

export const isTxParams = (obj: unknown): obj is TxParams => {
  const validator = {
    version: [validation.required(validation.isNumber)],
    to: [validation.required(validation.isAddress)],
    amount: [validation.required(validation.isBN)],
    gasPrice: [validation.required(validation.isBN)],
    gasLimit: [validation.required(validation.isBN)],
    code: [validation.isString],
    data: [validation.isString],
    receipt: [isTxReceipt],
    nonce: [validation.required(validation.isNumber)],
    signature: [validation.required(validation.isSignature)],
  };

  return validation.matchesObject(obj, validator);
};

export const formatOutgoingTx: ReqMiddlewareFn<[unknown]> = req => {
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
            amount: txConfig.amount.toNumber(),
            gasLimit: txConfig.gasLimit.toNumber(),
            gasPrice: txConfig.gasPrice.toNumber(),
          },
        ],
      },
    };

    return ret;
  }

  return req;
};
