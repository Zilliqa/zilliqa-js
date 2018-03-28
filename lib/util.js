// Copyright (c) 2018 Zilliqa 
// This source code is being disclosed to you solely for the purpose of your participation in 
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to 
// the protocols and algorithms that are programmed into, and intended by, the code. You may 
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd., 
// including modifying or publishing the code (or any part of it), and developing or forming 
// another public or private blockchain network. This source code is provided ‘as is’ and no 
// warranties are given as to title or non-infringement, merchantability or fitness for purpose 
// and, to the extent permitted by law, all liability for your use of the code is disclaimed. 

var isWebUri = require('valid-url').isWebUri


module.exports = {

	// make sure each of the keys in requiredArgs is present in args
	// and each of it's validator functions return true
	validateArgs: function (args, requiredArgs, optionalArgs) {
		for(var key in requiredArgs) {
			if (args[key] === undefined)
				throw new Error('Key not found: ' + key)

			for(var i = 0 ; i < requiredArgs[key].length ; i++) {
				if (typeof(requiredArgs[key][i]) != 'function')
					throw new Error('Validator is not a function')

				if (!requiredArgs[key][i](args[key]))
					throw new Error('Validation failed for ' + key)
			}
		}

		for(var key in optionalArgs) {
			if (args[key]) {
				for(var i = 0 ; i < optionalArgs[key].length ; i++) {
					if (typeof(optionalArgs[key][i]) != 'function')
						throw new Error('Validator is not a function')

					if (!optionalArgs[key][i](args[key]))
						throw new Error('Validation failed for ' + key)
				}
			}
		}
		return true
	},

	isAddress: function(address) {
		return !!(address.match(/^[0-9a-fA-F]{40}$/))
	},

	isPrivateKey: function(privateKey) {
		return !!(privateKey.match(/^[0-9a-fA-F]{64}$/))
	},

	isPubkey: function(pubkey) {
		return !!(pubkey.match(/^[0-9a-fA-F]{66}$/))
	},

	isUrl: function(url) {
		return isWebUri(url)
	},

	isHash: function(txHash) {
		return !!(txHash.match(/^[0-9a-fA-F]{64}$/))
	},

	isNumber: function(number) {
		return (typeof(number) == 'number')
	},

	isString: function(string) {
		return (typeof(string) == 'string')
	}
}