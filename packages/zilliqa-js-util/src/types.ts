import {RPCResponse} from '@zilliqa/zilliqa-js-core';

export const isError = <R, E>(
  response: RPCResponse<R, E>,
): response is RPCResponse<never, E> => {
  return (<{Error: E}>response.result).Error !== undefined;
};
