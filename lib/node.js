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
var $ = require('jquery')


function Node (args) {
  validateArgs(args, {
    url: [util.isUrl]
  })

  this.url = args.url
}

function rpcAjax(url, method, params, cb) {
  return $.ajax({
    url: url,
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: [params],
      id: 1
    })
  }).done(function(data) {
    cb(null, data);
  }).fail(function(err) {
    cb(err);
  })
}

// helper methods
Node.prototype.isConnected = function (cb) {
  rpcAjax(this.url, 'getNetworkId', [], cb)
}


// API methods
Node.prototype.getClientVersion = function (cb) {
  rpcAjax(this.url, 'getClientVersion', [], cb)
}

Node.prototype.getNetworkId = function (cb) {
  rpcAjax(this.url, 'getNetworkId', [], cb)
}

Node.prototype.getProtocolVersion = function (cb) {
  rpcAjax(this.url, 'getProtocolVersion', [], cb)
}

Node.prototype.createTransaction = function (args, cb) {
  try {
    validateArgs(args, {
      nonce: [util.isNumber],
      to: [util.isAddress],
      pubKey: [util.isPubkey],
      amount: [util.isNumber],
      gasPrice: [util.isNumber],
      gasLimit: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'createTransaction', args, cb)
}

Node.prototype.getTransaction = function (args, cb) {
  try {
    validateArgs(args, {
      txHash: [util.isHash]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'getTransaction', args.txHash, cb)
}

Node.prototype.getDsBlock = function (args, cb) {
  try {
    validateArgs(args, {
      blockNumber: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }
  
  rpcAjax(this.url, 'getDsBlock', args.blockNumber, cb)
}

Node.prototype.getTxBlock = function (args, cb) {
  try {
    validateArgs(args, {
      blockNumber: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }
  
  rpcAjax(this.url, 'getTxBlock', args.blockNumber, cb)
}

Node.prototype.getLatestDsBlock = function (cb) {
  rpcAjax(this.url, 'getLatestDsBlock', "", cb)
}

Node.prototype.getLatestTxBlock = function (cb) {
  rpcAjax(this.url, 'getLatestTxBlock', "", cb)
}

Node.prototype.getBalance = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'getBalance', args.address, cb)
}

Node.prototype.getGasPrice = function (cb) {
  rpcAjax(this.url, 'getGasPrice', "", cb)
}

Node.prototype.getStorageAt = function (args, cb) {
  try {
    validateArgs({
      address: [util.isAddress],
      index: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'getStorageAt', args, cb)
}

Node.prototype.getTransactionHistory = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
  }
  
  rpcAjax(this.url, 'getTransactionHistory', args.address, cb)
}

Node.prototype.getBlockTransactionCount = function (args, cb) {
  try {
    validateArgs(args, {
      blockNumber: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }
  
  rpcAjax(this.url, 'getBlockTransactionCount', args.blockNumber, cb)
}

Node.prototype.getCode = function (args, cb) {
  try {
    validateArgs(args, {
      address: [util.isAddress]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'getCode', args.address, cb)
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
  }

  rpcAjax(this.url, 'createMessage', args, cb)
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
  }

  rpcAjax(this.url, 'getGasEstimate', args, cb)
}

Node.prototype.getTransactionReceipt = function (args, cb) {
  try {
    validateArgs(args, {
      txHash: [util.isHash]
    })
  } catch (e) {
    cb(e)
  }

  rpcAjax(this.url, 'getTransactionReceipt', args.txHash, cb)
}

Node.prototype.getHashrate = function (cb) {
  rpcAjax(this.url, 'getHashrate', "", cb)
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
  }

  rpcAjax(this.url, 'compileCode', args, cb)
}

// Explorer APIs
Node.prototype.getHomeData = function (args, cb) {
  try {
    validateArgs(args, {
      blockNumber: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }
  
  rpcAjax(this.url, 'getBlockchainInfo', "", cb)
}

Node.prototype.getDSBlockListing = function (args, cb) {
  try {
    validateArgs(args, {
      page: [util.isNumber]
    })
  } catch (e) {
    cb(e)
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
  }
  
  rpcAjax(this.url, 'TxBlockListing', args.page, cb)
}

Node.prototype.getTransactionListing = function (args, cb) {
  /*
  try {
    validateArgs(args, {
      page: [util.isNumber]
    })
  } catch (e) {
    cb(e)
  }
  */
  
  rpcAjax(this.url, 'getRecentTransactions', "", cb)
}


module.exports = Node
