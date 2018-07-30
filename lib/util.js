// Copyright (c) 2018 Zilliqa 
// This source code is being disclosed to you solely for the purpose of your participation in 
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to 
// the protocols and algorithms that are programmed into, and intended by, the code. You may 
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd., 
// including modifying or publishing the code (or any part of it), and developing or forming 
// another public or private blockchain network. This source code is provided ‘as is’ and no 
// warranties are given as to title or non-infringement, merchantability or fitness for purpose 
// and, to the extent permitted by law, all liability for your use of the code is disclaimed. 

var secp256k1 = require('bcrypto').secp256k1
var sha256 = require('bcrypto').sha256
var isWebUri = require('valid-url').isWebUri
var schnorr = require('./schnorr')


module.exports = {
// generate a new private key using the secp256k1 curve
// returns a Buffer object, 
generatePrivateKey: function () {
	return secp256k1.generatePrivateKey()
},

// verify if the private key is valid for the secp256k1 curve
// inputs Buffer and returns true/false
verifyPrivateKey: function (privateKey) {
	if (typeof(privateKey) == 'string') {
		privateKey = new Buffer(privateKey, 'hex')
	}

	return secp256k1.privateKeyVerify(privateKey)
},

// get the public address of an account using its private key
getAddressFromPrivateKey: function (privateKey) {
	if (typeof(privateKey) == 'string') {
		privateKey = new Buffer(privateKey, 'hex')
	}

	let pubKey = secp256k1.publicKeyCreate(privateKey, true)
	let pubKeyHash = sha256.digest(pubKey) // sha256 hash of the public key
	let address = pubKeyHash.toString('hex', 12) // rightmost 160 bits/20 bytes of the hash

	return address
},

getPubKeyFromPrivateKey: function (privateKey) {
	if (typeof(privateKey) == 'string') {
		privateKey = new Buffer(privateKey, 'hex')
	}

	return secp256k1.publicKeyCreate(privateKey, true)
},

// Get address from a public key
getAddressFromPublicKey: function (pubKey) {
	if (typeof(pubKey) == 'string') {
		pubKey = new Buffer(pubKey, 'hex');
	}
	let pubKeyHash = sha256.digest(pubKey); // sha256 hash of the public key
	let address = pubKeyHash.toString('hex', 12); // rightmost 160 bits/20 bytes of the hash
	return address;
},

// construct the transaction json
// input the privateKey and transaction object
createTransactionJson: function (privateKey, txnDetails) {
	if (typeof(privateKey) == 'string') {
		privateKey = new Buffer(privateKey, 'hex')
	}
	let pubKey = secp256k1.publicKeyCreate(privateKey, true)

	let txn = {
		version: txnDetails.version,
		nonce: txnDetails.nonce,
		to: txnDetails.to,
		amount: txnDetails.amount,
		pubKey: pubKey.toString('hex'),
		gasPrice: txnDetails.gasPrice,
		gasLimit: txnDetails.gasLimit,
		code: txnDetails.code || "",
		data: txnDetails.data || ""
	}

	let codeHex = new Buffer(txn.code).toString('hex')
	let dataHex = new Buffer(txn.data).toString('hex')

	let msg = this.intToByteArray(txn.version, 64).join('') +
			this.intToByteArray(txn.nonce, 64).join('') +
			txn.to +
			txn.pubKey +
			this.intToByteArray(txn.amount, 64).join('') +
			this.intToByteArray(txn.gasPrice, 64).join('') +
			this.intToByteArray(txn.gasLimit, 64).join('') +
			this.intToByteArray(txn.code.length, 8).join('') + // size of code
			codeHex +
			this.intToByteArray(txn.data.length, 8).join('') + // size of data
			dataHex

	// sign using schnorr lib
	let sig = schnorr.sign(new Buffer(msg, 'hex'), privateKey, pubKey)
	
	let r = sig.r.toString('hex')
	let s = sig.s.toString('hex')
	while (r.length < 64) {
		r = '0' + r
	}
	while (s.length < 64) {
		s = '0' + s
	}
	txn['signature'] = r + s
	
	return txn
},

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

isAddress: function (address) {
	return !!(address.match(/^[0-9a-fA-F]{40}$/))
},

isPrivateKey: function (privateKey) {
	return !!(privateKey.match(/^[0-9a-fA-F]{64}$/))
},

isPubkey: function (pubkey) {
	return !!(pubkey.match(/^[0-9a-fA-F]{66}$/))
},

isUrl: function (url) {
	return isWebUri(url)
},

isHash: function (txHash) {
	return !!(txHash.match(/^[0-9a-fA-F]{64}$/))
},

isNumber: function (number) {
	return (typeof(number) == 'number')
},

isString: function (string) {
	return (typeof(string) == 'string')
},

// convert number to array representing the padded hex form
intToByteArray: function(val, paddedSize) {
	var arr = []

	let hexVal = val.toString(16)
	let hexRep = []

	var i
	for(i = 0 ; i < hexVal.length ; i++) {
		hexRep[i] = hexVal[i].toString()
	}

	for(i = 0 ; i < (paddedSize - hexVal.length) ; i++){
		arr.push('0')
	}

	for(i = 0 ; i < hexVal.length ; i++) {
		arr.push(hexRep[i])
	}

	return arr
}
}
