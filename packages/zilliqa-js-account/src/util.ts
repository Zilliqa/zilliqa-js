import {bytes} from 'zilliqa-js-util';
import {BaseTx} from './types';

/**
 * encodeTransaction
 *
 * @param {Transaction} tx - JSON-encoded tx to convert to a byte array
 * @returns {Buffer} - Buffer of bytes
 */
export const encodeTransaction = (tx: BaseTx): Buffer => {
  let codeHex = Buffer.from(tx.code || '').toString('hex');
  let dataHex = Buffer.from(tx.data || '').toString('hex');

  let encoded =
    bytes.intToHexArray(tx.version, 64).join('') +
    bytes.intToHexArray(tx.nonce || 0, 64).join('') +
    tx.to +
    tx.pubKey +
    tx.amount.toString('hex', 64) +
    bytes.intToHexArray(tx.gasPrice, 64).join('') +
    bytes.intToHexArray(tx.gasLimit, 64).join('') +
    bytes.intToHexArray((tx.code && tx.code.length) || 0, 8).join('') + // size of code
    codeHex +
    bytes.intToHexArray((tx.data && tx.data.length) || 0, 8).join('') + // size of data
    dataHex;

  return Buffer.from(encoded, 'hex');
};
