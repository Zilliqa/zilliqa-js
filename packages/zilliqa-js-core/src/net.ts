import fetch from 'cross-fetch';
// import { validation } from '@zilliqa-js/util';
import { WithRequest } from './util';

/**
 * blockchain-side.
 */
export const enum RPCMethod {
  // Network-related methods
  GetNetworkId = 'GetNetworkId',

  // Blockchain-related methods
  GetBlockchainInfo = 'GetBlockchainInfo',
  GetShardingStructure = 'GetShardingStructure',
  GetDSBlock = 'GetDsBlock',
  GetLatestDSBlock = 'GetLatestDsBlock',
  GetNumDSBlocks = 'GetNumDSBlocks',
  GetDSBlockRate = 'GetDSBlockRate',
  DSBlockListing = 'DSBlockListing',
  GetTxBlock = 'GetTxBlock',
  GetLatestTxBlock = 'GetLatestTxBlock',
  GetNumTxBlocks = 'GetNumTxBlocks',
  GetTxBlockRate = 'GetTxBlockRate',
  TxBlockListing = 'TxBlockListing',
  GetNumTransactions = 'GetNumTransactions',
  GetTransactionRate = 'GetTransactionRate',
  GetCurrentMiniEpoch = 'GetCurrentMiniEpoch',
  GetCurrentDSEpoch = 'GetCurrentDSEpoch',
  GetPrevDifficulty = 'GetPrevDifficulty',
  GetPrevDSDifficulty = 'GetPrevDSDifficulty',

  // Transaction-related methods
  CreateTransaction = 'CreateTransaction',
  GetTransaction = 'GetTransaction',
  GetRecentTransactions = 'GetRecentTransactions',
  GetTransactionsForTxBlock = 'GetTransactionsForTxBlock',
  GetNumTxnsTxEpoch = 'GetNumTxnsTxEpoch',
  GetNumTxnsDSEpoch = 'GetNumTxnsDSEpoch',
  GetMinimumGasPrice = 'GetMinimumGasPrice',

  // Contract-related methods
  GetSmartContractCode = 'GetSmartContractCode',
  GetSmartContractInit = 'GetSmartContractInit',
  GetSmartContractState = 'GetSmartContractState',
  GetContractAddressFromTransactionID = 'GetContractAddressFromTransactionID',

  // Account-related methods
  GetBalance = 'GetBalance',
}

export const enum RPCErrorCode {
  // Standard JSON-RPC 2.0 errors
  // RPC_INVALID_REQUEST is internally mapped to HTTP_BAD_REQUEST (400).
  // It should not be used for application-layer errors.
  RPC_INVALID_REQUEST = -32600,
  // RPC_METHOD_NOT_FOUND is internally mapped to HTTP_NOT_FOUND (404).
  // It should not be used for application-layer errors.
  RPC_METHOD_NOT_FOUND = -32601,
  RPC_INVALID_PARAMS = -32602,
  // RPC_INTERNAL_ERROR should only be used for genuine errors in bitcoind
  // (for example datadir corruption).
  RPC_INTERNAL_ERROR = -32603,
  RPC_PARSE_ERROR = -32700,

  // General application defined errors
  RPC_MISC_ERROR = -1, // std::exception thrown in command handling
  RPC_TYPE_ERROR = -3, // Unexpected type was passed as parameter
  RPC_INVALID_ADDRESS_OR_KEY = -5, // Invalid address or key
  RPC_INVALID_PARAMETER = -8, // Invalid, missing or duplicate parameter
  RPC_DATABASE_ERROR = -20, // Database error
  RPC_DESERIALIZATION_ERROR = -22, // Error parsing or validating structure in raw format
  RPC_VERIFY_ERROR = -25, // General error during transaction or block submission
  RPC_VERIFY_REJECTED = -26, // Transaction or block was rejected by network rules
  RPC_IN_WARMUP = -28, // Client still warming up
  RPC_METHOD_DEPRECATED = -32, // RPC method is deprecated
}

export interface RPCRequestPayload<T> {
  id: 1;
  jsonrpc: '2.0';
  method: RPCMethod;
  params: T;
}

interface RPCRequestOptions {
  headers?: Headers;
  method?: string;
}

export interface RPCRequest<T> {
  url: string;
  payload: RPCRequestPayload<T>;
  options?: RPCRequestOptions;
}

interface RPCResponseBase {
  jsonrpc: '2.0';
  id: '1';
}

export interface RPCResponseSuccess<R = any> extends RPCResponseBase {
  result: R;
  error: undefined;
}

export interface RPCResponseError<E = any> extends RPCResponseBase {
  result: undefined;
  error: RPCError<E>;
}

export interface RPCError<E> {
  code: RPCErrorCode;
  message: string;
  data?: E;
}

export type RPCResponse<R, E> = RPCResponseSuccess<R> | RPCResponseError<E>;

export type RPCResponseHandler<R, E, T> = (
  response: WithRequest<RPCResponse<R, E>>,
) => T;

const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

export const performRPC = async <R, E, D extends any[], T = RPCResponse<R, E>>(
  request: RPCRequest<D>,
  handler: RPCResponseHandler<R, E, T>,
): Promise<T> => {
  try {
    const response = await fetch(request.url, {
      method: 'POST',
      cache: 'no-cache',
      mode: 'cors',
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(request.payload),
      headers: {
        ...DEFAULT_HEADERS,
        ...((request.options && request.options.headers) || {}),
      },
    });

    return response
      .json()
      .then((body) => {
        return { ...body, req: request };
      })
      .then(handler);
  } catch (err) {
    throw err;
  }
};
