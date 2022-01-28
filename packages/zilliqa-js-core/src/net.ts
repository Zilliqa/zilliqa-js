//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
import 'cross-fetch/polyfill';
import { WithRequest } from './util';

/**
 * blockchain-side.
 */
export enum RPCMethod {
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
  GetTotalCoinSupply = 'GetTotalCoinSupply',
  GetMinerInfo = 'GetMinerInfo',

  // Transaction-related methods
  CreateTransaction = 'CreateTransaction',
  GetTransaction = 'GetTransaction',
  GetTransactionStatus = 'GetTransactionStatus',
  GetRecentTransactions = 'GetRecentTransactions',
  GetTransactionsForTxBlock = 'GetTransactionsForTxBlock',
  GetTransactionsForTxBlockEx = 'GetTransactionsForTxBlockEx',
  GetTxnBodiesForTxBlock = 'GetTxnBodiesForTxBlock',
  GetTxnBodiesForTxBlockEx = 'GetTxnBodiesForTxBlockEx',
  GetNumTxnsTxEpoch = 'GetNumTxnsTxEpoch',
  GetNumTxnsDSEpoch = 'GetNumTxnsDSEpoch',
  GetMinimumGasPrice = 'GetMinimumGasPrice',

  // Contract-related methods
  GetContractAddressFromTransactionID = 'GetContractAddressFromTransactionID',
  GetSmartContracts = 'GetSmartContracts',
  GetSmartContractCode = 'GetSmartContractCode',
  GetSmartContractInit = 'GetSmartContractInit',
  GetSmartContractState = 'GetSmartContractState',
  GetSmartContractSubState = 'GetSmartContractSubState',
  GetStateProof = 'GetStateProof',

  // Account-related methods
  GetBalance = 'GetBalance',
}

export enum RPCErrorCode {
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
  id: number;
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
  payload: RPCRequestPayload<T> | RPCRequestPayload<T>[];
  options?: RPCRequestOptions;
}

interface RPCResponseBase {
  jsonrpc: '2.0';
  id: number;
}

export interface RPCResponseSuccess<R = any> extends RPCResponseBase {
  batch_result?: R; // for batch response
  result: R; // for non-batch response
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
      } as HeadersInit,
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

// identical to performRPC; difference is the response
export const performBatchRPC = async <
  R,
  E,
  D extends any[],
  T = RPCResponse<R, E>,
>(
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
      } as HeadersInit,
    });

    return (
      response
        .json()
        .then((batch_result) => {
          return { batch_result, req: request };
        })
        // no handler as compared to performRPC to preserve the body array
        // e.g. response
        /*
      { body:
        [ { id: 1, jsonrpc: '2.0', result: [Object] },
          { id: 1, jsonrpc: '2.0', result: [Object] } ],
       req:
        { url: 'https://dev-api.zilliqa.com',
          payload: [ [Object], [Object] ] } }
      */
        .then()
    );
  } catch (err) {
    throw err;
  }
};
