//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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
