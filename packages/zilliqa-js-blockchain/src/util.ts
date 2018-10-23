import BN from 'bn.js';

import {TxParams} from '@zilliqa/zilliqa-js-account';
import {RPCResponse} from '@zilliqa/zilliqa-js-core';

import {TransactionObj} from './types';

export function isError(
  response: RPCResponse<TransactionObj, string>,
): response is RPCResponse<never, string> {
  return typeof (<{Error: string}>response.result).Error === 'string';
}

export function toTxParams(
  response: RPCResponse<TransactionObj, never>,
): TxParams {
  const {
    toAddr,
    gasPrice,
    gasLimit,
    amount,
    nonce,
    receipt,
    version,
    ...rest
  } = <TransactionObj>response.result;

  return {
    ...rest,
    version: parseInt(version, 10),
    toAddr,
    gasPrice: new BN(gasPrice),
    gasLimit: new BN(gasLimit),
    amount: new BN(amount),
    receipt: {...receipt, cumulative_gas: parseInt(receipt.cumulative_gas, 10)},
  };
}
