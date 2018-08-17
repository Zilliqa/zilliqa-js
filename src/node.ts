// Copyright (c) 2018 Zilliqa
// This source code is being disclosed to you solely for the purpose of your participation in
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to
// the protocols and algorithms that are programmed into, and intended by, the code. You may
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd.,
// including modifying or publishing the code (or any part of it), and developing or forming
// another public or private blockchain network. This source code is provided ‘as is’ and no
// warranties are given as to title or non-infringement, merchantability or fitness for purpose
// and, to the extent permitted by law, all liability for your use of the code is disclaimed.
import BN from 'bn.js';
import {validateArgs} from './util';
import * as util from './util';

type callback = (error: any, data: any) => any;

export default class ZNode {
  url: string;
  apiUrl: string;

  constructor(args: any) {
    validateArgs(args, {
      url: [util.isUrl],
    });

    this.url = args.url;
    this.apiUrl = 'https://api.zilliqa.com';
  }

  /**
   * isConnected
   *
   * returns network id
   *
   * @param {callback} cb
   */
  isConnected = (cb: callback) => {
    rpcAjax(this.url, 'GetNetworkId', [], cb);
  };

  /**
   * getNetworkId
   *
   * alias for isConnected
   *
   * @param {callback} cb
   */
  getNetworkId = (cb: callback) => {
    this.isConnected(cb);
  };

  getClientVersion = (cb: callback) => {
    rpcAjax(this.url, 'GetClientVersion', [], cb);
  };

  getProtocolVersion = (cb: callback) => {
    rpcAjax(this.url, 'GetProtocolVersion', [], cb);
  };

  createTransaction = (args, cb) => {
    try {
      validateArgs(args, {
        to: [util.isAddress],
        pubKey: [util.isPubKey],
        amount: [BN.isBN],
        gasPrice: [util.isNumber],
        gasLimit: [util.isNumber],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(
      this.url,
      'CreateTransaction',
      // FIXME: core must be able to parse amount as string; it currently does
      // not. the issue is being tracked here: https://github.com/Zilliqa/Zilliqa/issues/524
      {...args, amount: args.amount.toNumber()},
      cb,
    );
  };

  getTransaction = (args, cb) => {
    try {
      validateArgs(args, {
        txHash: [util.isHash],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetTransaction', args.txHash, cb);
  };

  getDsBlock = (args, cb) => {
    rpcAjax(this.url, 'GetDsBlock', args.blockNumber, cb);
  };

  getTxBlock = (args, cb) => {
    rpcAjax(this.url, 'GetTxBlock', args.blockNumber, cb);
  };

  getLatestDsBlock = cb => {
    rpcAjax(this.url, 'GetLatestDsBlock', '', cb);
  };

  getLatestTxBlock = cb => {
    rpcAjax(this.url, 'GetLatestTxBlock', '', cb);
  };

  getBalance = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetBalance', args.address, cb);
  };

  getGasPrice = cb => {
    rpcAjax(this.url, 'GetGasPrice', '', cb);
  };

  getSmartContractState = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetSmartContractState', args.address, cb);
  };

  getSmartContractCode = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetSmartContractCode', args.address, cb);
  };

  getSmartContractInit = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetSmartContractInit', args.address, cb);
  };

  getSmartContracts = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetSmartContracts', args.address, cb);
  };

  getTransactionHistory = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetTransactionHistory', args.address, cb);
  };

  getBlockTransactionCount = (args, cb) => {
    try {
      validateArgs(args, {
        blockNumber: [util.isNumber],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetBlockTransactionCount', args.blockNumber, cb);
  };

  getCode = (args, cb) => {
    try {
      validateArgs(args, {
        address: [util.isAddress],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetCode', args.address, cb);
  };

  createMessage = (args, cb) => {
    try {
      validateArgs(
        {
          to: [util.isAddress],
        },
        {
          from: [util.isAddress],
          gas: [util.isNumber],
          gasPrice: [util.isNumber],
        },
      );
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'CreateMessage', args, cb);
  };

  getGasEstimate = (args, cb) => {
    try {
      validateArgs(
        {},
        {
          to: [util.isAddress],
          from: [util.isAddress],
          gas: [util.isNumber],
          gasPrice: [util.isNumber],
          gasLimit: [util.isNumber],
        },
      );
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetGasEstimate', args, cb);
  };

  getTransactionReceipt = (args, cb) => {
    try {
      validateArgs(args, {
        txHash: [util.isHash],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'GetTransactionReceipt', args.txHash, cb);
  };

  getHashrate = cb => {
    rpcAjax(this.url, 'GetHashrate', '', cb);
  };

  isNodeMining = (args, cb) => {
    rpcAjax(this.url, 'isNodeMining', '', cb);
  };

  compileCode = (args, cb) => {
    try {
      validateArgs(args, {
        code: [util.isString],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'CompileCode', args, cb);
  };

  checkCode = (args, cb) => {
    try {
      validateArgs(args, {
        code: [util.isString],
      });
    } catch (e) {
      cb(e);
      return;
    }

    serverAjax(this.apiUrl + '/v1/checker', args, cb);
  };

  checkCodeTest = (args, cb) => {
    try {
      validateArgs(args, {
        code: [util.isString],
      });
    } catch (e) {
      cb(e);
      return;
    }

    serverAjax(this.apiUrl + '/v1/runner', args, cb);
  };

  // Explorer APIs
  getBlockchainInfo = (args, cb) => {
    rpcAjax(this.url, 'GetBlockchainInfo', '', cb);
  };

  getDSBlockListing = (args, cb) => {
    try {
      validateArgs(args, {
        page: [util.isNumber],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'DSBlockListing', args.page, cb);
  };

  getTxBlockListing = (args, cb) => {
    try {
      validateArgs(args, {
        page: [util.isNumber],
      });
    } catch (e) {
      cb(e);
      return;
    }

    rpcAjax(this.url, 'TxBlockListing', args.page, cb);
  };

  getNumTxnsTxEpoch = (args, cb) => {
    rpcAjax(this.url, 'GetNumTxnsTxEpoch', '', cb);
  };

  getNumTxnsDSEpoch = (args, cb) => {
    rpcAjax(this.url, 'GetNumTxnsDSEpoch', '', cb);
  };

  getTransactionListing = (args, cb) => {
    rpcAjax(this.url, 'GetRecentTransactions', '', cb);
  };
}

function rpcAjax(url, method, params, cb) {
  postData(url, {
    jsonrpc: '2.0',
    method: method,
    params: [params],
    id: 1,
  })
    .then(data => cb(null, data))
    .catch(error => cb(error));
}

function serverAjax(url, data, cb) {
  postData(url, data)
    .then(data => cb(null, data))
    .catch(error => cb(error));
}

function postData(url, data) {
  return fetch(url, {
    body: JSON.stringify(data),
    cache: 'no-cache',
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    referrer: 'no-referrer',
  }).then(response => response.json());
}
