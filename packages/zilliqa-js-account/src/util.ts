import {bytes} from '@zilliqa/zilliqa-js-util';
import {TxParams} from './types';

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
