const hashjs = require('hash.js');
const utils = require('web3-utils');

utils.sha3 = (buffer: Buffer): string => {
  return hashjs
    .sha256()
    .update(buffer, 'hex')
    .digest('hex');
};

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3();

const PASSPHRASE = 'stronk_password';
const KEYSTORE_NUMS = 10;

const results = [];

for (let i = 0; i < KEYSTORE_NUMS; i++) {
  const { privateKey } = web3.eth.accounts.create();
  const keystore = web3.eth.accounts.encrypt(privateKey, PASSPHRASE, {
    kdf: Math.random() < 0.5 ? 'pbkdf2' : 'scrypt',
  });
  results.push({
    privateKey,
    passphrase: PASSPHRASE,
    keystore,
  });
}

fs.writeFileSync('./keystores.json', JSON.stringify(results, null, 2));
