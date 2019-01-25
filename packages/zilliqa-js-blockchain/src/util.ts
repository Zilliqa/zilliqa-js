import { TxParams } from '@zilliqa-js/account';
import { RPCResponse, TransactionObj } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

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
    gasLimit: Long.fromString(gasLimit, 10),
    amount: new BN(amount),
    receipt: {
      ...receipt,
      cumulative_gas: parseInt(receipt.cumulative_gas, 10),
    },
  };
}
