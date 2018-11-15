import { RPCResponse } from '@zilliqa-js/core';

export const isError = <R, E>(
  response: RPCResponse<R, E>,
): response is RPCResponse<never, E> => {
  return (
    // we check for pascal case as well, in because rpc server returns
    // inconsistent payloads.
    (<{ error: E }>response.result).error !== undefined ||
    (<{ Error: E }>response.result).Error !== undefined
  );
};
