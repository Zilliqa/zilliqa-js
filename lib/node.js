// Copyright (c) 2018 Zilliqa 
// This source code is being disclosed to you solely for the purpose of your participation in 
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to 
// the protocols and algorithms that are programmed into, and intended by, the code. You may 
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd., 
// including modifying or publishing the code (or any part of it), and developing or forming 
// another public or private blockchain network. This source code is provided ‘as is’ and no 
// warranties are given as to title or non-infringement, merchantability or fitness for purpose 
// and, to the extent permitted by law, all liability for your use of the code is disclaimed. 

var util = require('./util')
var validateArgs = util.validateArgs
var request = require('request')


function Node (args) {
  validateArgs(args, {
    url: [util.isUrl]
  })

  this.url = args.url
}

function rpcAjax(url, method, params, cb) {
  postData(url, {
    jsonrpc: '2.0',
    method: method,
    params: [params],
    id: 1
  })
  .then(data => cb(null, data))
  .catch(error => cb(error))
}

function postData(url, data) {
  return fetch(url, {
    body: JSON.stringify(data),
    cache: 'no-cache',
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    referrer: 'no-referrer',
  })
  .then(response => response.json())
}


// helper methods
Node.prototype.isConnected = function (cb) {
  rpcAjax(this.url, 'GetNetworkId', [], cb)
}


// API methods
Node.prototype.getClientVersion = function (cb) {
  rpcAjax(this.url, 'GetClientVersion', [], cb)
}

Node.prototype.getNetworkId = function (cb) {
  rpcAjax(this.url, 'GetNetworkId', [], cb)
}

Node.prototype.getProtocolVersion = function (cb) {
  rpcAjax(this.url, 'GetProtocolVersion', [], cb)
}

Node.prototype.createTransaction = function (args, cb) {
  try {
    validateArgs(args, {
      to: [util.isAddress],
      pubKey: [util.isPubkey],
      amount: [util.isNumber],
      gasPrice: [util.isNumber],
      gasLimit: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'CreateTransaction', args, cb)
}

Node.prototype.getTransaction = function (args, cb) {
  try {
    validateArgs(args, {
      txHash: [util.isHash]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetTransaction', args.txHash, cb)
}

Node.prototype.getDsBlock = function (args, cb) {  
  rpcAjax(this.url, 'GetDsBlock', args.blockNumber, cb)
}

Node.prototype.getTxBlock = function (args, cb) {
  
  rpcAjax(this.url, 'GetTxBlock', args.blockNumber, cb)
}

Node.prototype.getLatestDsBlock = function (cb) {
  rpcAjax(this.url, 'GetLatestDsBlock', "", cb)
}

Node.prototype.getLatestTxBlock = function (cb) {
  rpcAjax(this.url, 'GetLatestTxBlock', "", cb)
}

Node.prototype.getBalance = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetBalance', args.address, cb)
}

Node.prototype.getGasPrice = function (cb) {
  rpcAjax(this.url, 'GetGasPrice', "", cb)
}

Node.prototype.getSmartContractState = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetSmartContractState', args, cb)
}

Node.prototype.getSmartContractCode = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetSmartContractCode', args, cb)
}

Node.prototype.getSmartContracts = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetSmartContracts', args, cb)
}

Node.prototype.getTransactionHistory = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }
  
  rpcAjax(this.url, 'GetTransactionHistory', args.address, cb)
}

Node.prototype.getBlockTransactionCount = function (args, cb) {
  try {
    validateArgs(args, {
      blockNumber: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }
  
  rpcAjax(this.url, 'GetBlockTransactionCount', args.blockNumber, cb)
}

Node.prototype.getCode = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetCode', args.address, cb)
}

Node.prototype.createMessage = function (args, cb) {
  try {
    validateArgs({
      to: [util.isAddress]
    }, {
      from: [util.isAddress],
      gas: [util.isNumber],
      gasPrice: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'CreateMessage', args, cb)
}

Node.prototype.getGasEstimate = function (args, cb) {
  try {
    validateArgs({}, {
      to: [util.isAddress],
      from: [util.isAddress],
      gas: [util.isNumber],
      gasPrice: [util.isNumber],
      gasLimit: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetGasEstimate', args, cb)
}

Node.prototype.getTransactionReceipt = function (args, cb) {
  try {
    validateArgs(args, {
      txHash: [util.isHash]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'GetTransactionReceipt', args.txHash, cb)
}

Node.prototype.getHashrate = function (cb) {
  rpcAjax(this.url, 'GetHashrate', "", cb)
}

Node.prototype.isNodeMining = function (args, cb) {
  rpcAjax(this.url, 'isNodeMining', "", cb)
}

Node.prototype.compileCode = function (args, cb) {
  try {
    validateArgs({
      code: [util.isString]
    })
  } catch (e) {
    cb(e)
    return
  }

  rpcAjax(this.url, 'CompileCode', args, cb)
}

// Explorer APIs
Node.prototype.getBlockchainInfo = function (args, cb) {
  
  rpcAjax(this.url, 'GetBlockchainInfo', "", cb)
}

Node.prototype.getDSBlockListing = function (args, cb) {
  try {
    validateArgs(args, {
      page: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }
  
  rpcAjax(this.url, 'DSBlockListing', args.page, cb)
}

Node.prototype.getTxBlockListing = function (args, cb) {
  try {
    validateArgs(args, {
      page: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }
  
  rpcAjax(this.url, 'TxBlockListing', args.page, cb)
}

Node.prototype.getNumTxnsTxEpoch = function (args, cb) {
  rpcAjax(this.url, 'GetNumTxnsTxEpoch', "", cb)
}

Node.prototype.getNumTxnsDSEpoch = function (args, cb) {
  rpcAjax(this.url, 'GetNumTxnsDSEpoch', "", cb)
}

Node.prototype.getTransactionListing = function (args, cb) {
  /*
  try {
    validateArgs(args, {
      page: [util.isNumber]
    })
  } catch (e) {
    cb(e)
    return
  }
  */
  
  rpcAjax(this.url, 'GetRecentTransactions', "", cb)
}


module.exports = Node
