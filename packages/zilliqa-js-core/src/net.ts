import 'cross-fetch/polyfill';
import {createError, Errors, ZjsError} from './errors';

/**
 * TODO: Enable commented-out methods when they are implemented
 * blockchain-side.
 */
export const enum RPCMethod {
  // Network-related methods
  GetNetworkId = 'GetNetworkId',
  // GetClientVersion = 'GetClientVersion',
  // GetProtocolVersion = 'GetProtocolVersion',

  // Blockchain-related methods
  GetBlockchainInfo = 'GetBlockchainInfo',
  GetShardingStructure = 'GetShardingStructure',
  GetDSBlock = 'GetDSBlock',
  GetLatestDSBlock = 'GetLatestDsBlock',
  GetNumDSBlocks = 'GetNumDSBlocks',
  GetDSBlockRate = 'GetDSBlockRate',
  DSBlockListing = 'DSBlockListing',
  GetTxBlock = 'GetTSBlock',
  GetLatestTxBlock = 'GetLatestTxBlock',
  GetNumTxBlocks = 'GetNumTxBlocks',
  GetTxBlockRate = 'GetTxBlockRate',
  TxBlockListing = 'TxBlockListing',
  GetNumTransactions = 'GetNumTransactions',
  GetTransactionRate = 'GetTransactionRate',
  GetCurrentMiniEpoch = 'GetCurrentMiniEpoch',
  GetCurrentDSEpoch = 'GetCurrentDSEpoch',
  // GetBlockTransactionCount = 'GetBlockTransactionCount',

  // Transaction-related methods
  CreateTransaction = 'CreateTransaction',
  GetTransaction = 'GetTransaction',
  GetTransactionReceipt = 'GetTransactionReceipt',
  GetRecentTransactions = 'GetRecentTransactions',
  GetNumTxnsTxEpoch = 'GetNumTxnsTxEpoch',
  GetNumTxnsDSEpoch = 'GetNumTxnsDSEpoch',
  // GetGasPrice = 'GetGasPrice',
  // GetGasEstimate = 'GetGasEstimate',

  // Contract-related methods
  GetSmartContractCode = 'GetSmartContractCode',
  GetSmartContractInit = 'GetSmartContractInit',
  GetSmartContractState = 'GetSmartContractState',
  GetContractAddressFromTransactionID = 'GetContractAddressFromTransactionID',
  // GetStorageAt = 'GetStorageAt',

  // Account-related methods
  GetBalance = 'GetBalance',
}

export interface RPCBasePayload {
  id: 1;
  jsonrpc: '2.0';
}

export interface RPCRequestPayload<T> extends RPCBasePayload {
  params: T;
}

interface RPCRequestOptions {
  headers?: Headers;
  method?: string;
}

export interface RPCRequest<T> {
  url: string;
  method: RPCMethod;
  payload: RPCRequestPayload<T>;
  options?: RPCRequestOptions;
}

export interface RPCResponseSuccess<R = any> extends RPCBasePayload {
  result: R;
}

export interface RPCResponseError<E> extends RPCBasePayload {
  result: {Error: E};
}

export type RPCResponse<R, E> = RPCResponseSuccess<R> | RPCResponseError<E>;

export type RPCResponseHandler<R, E, T> = (response: RPCResponse<R, E>) => T;

const DEFAULT_TIMEOUT = 120000;
const DEFAULT_HEADERS = {'Content-Type': 'application/json'};

export const performRPC = async <R, E, D, T = RPCResponse<R, E>>(
  request: RPCRequest<D>,
  handler: RPCResponseHandler<R, E, T>,
): Promise<T> => {
  try {
    const response = await fetch(request.url, {
      method: (request.options && request.options.method) || 'POST',
      body: JSON.stringify(request.payload),
      headers: {
        ...DEFAULT_HEADERS,
        ...((request.options && request.options.headers) || {}),
      },
    });

    return response
      .json()
      .then(body => body.data)
      .then(handler);
  } catch (err) {
    throw err;
  }
};
