import {bytes} from 'zilliqa-js-util';
import {Transaction} from './types';

/**
 * encodeTransaction
 *
 * @param {Transaction} tx - JSON-encoded tx to convert to a byte array
 * @returns {Buffer} - Buffer of bytes
 */
export const encodeTransaction = (tx: Transaction): Buffer => {
  let codeHex = Buffer.from(tx.code).toString('hex');
  let dataHex = Buffer.from(tx.data).toString('hex');

  let encoded =
    bytes.intToHexArray(tx.version, 64).join('') +
    bytes.intToHexArray(tx.nonce, 64).join('') +
    tx.to +
    tx.pubKey +
    tx.amount.toString('hex', 64) +
    bytes.intToHexArray(tx.gasPrice, 64).join('') +
    bytes.intToHexArray(tx.gasLimit, 64).join('') +
    bytes.intToHexArray(tx.code.length, 8).join('') + // size of code
    codeHex +
    bytes.intToHexArray(tx.data.length, 8).join('') + // size of data
    dataHex;

  return Buffer.from(encoded, 'hex');
};
