// Copyright (c) 2018 Zilliqa 
// This source code is being disclosed to you solely for the purpose of your participation in 
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to 
// the protocols and algorithms that are programmed into, and intended by, the code. You may 
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd., 
// including modifying or publishing the code (or any part of it), and developing or forming 
// another public or private blockchain network. This source code is provided ‘as is’ and no 
// warranties are given as to title or non-infringement, merchantability or fitness for purpose 
// and, to the extent permitted by law, all liability for your use of the code is disclaimed. 

var Node = require('./node')
var util = require('./util')
var schnorr = require('./schnorr')
var config = require('./config.json')
var ajax = util.ajax
var validateArgs = util.validateArgs


function zLib (args) {
  validateArgs(args, {}, {
    nodeUrl: [util.isUrl]
  })

  this.version = config.version
  this.node = new Node({url: (args.nodeUrl || config.defaultNodeUrl)})
  this.schnorr = schnorr
	this.data = {}
}


// library methods
zLib.prototype.getLibraryVersion = function () {
  return this.version
}

zLib.prototype.isConnected = function () {
  return (this.node && this.node.isConnected())
}

zLib.prototype.getNode = function () {
  return this.node
}

zLib.prototype.setNode = function (args) {
  validateArgs(args, {
    nodeUrl: [util.isUrl]
  })

  this.node = new Node(args.nodeUrl)
  return null
}


module.exports = zLib
