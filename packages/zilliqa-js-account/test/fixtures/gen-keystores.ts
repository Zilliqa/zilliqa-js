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

const { encryptPrivateKey, schnorr } = require('@zilliqa-js/crypto');

const fs = require('fs');

const passphrase = 'strong_password';

const KEYSTORE_NUMS = 10;

async function generateTestKeystores() {
  let results = [];
  for (let i = 0; i < KEYSTORE_NUMS; i++) {
    const privateKey = schnorr.generatePrivateKey();
    try {
      const keystore = await encryptPrivateKey(
        'scrypt',
        privateKey,
        passphrase,
      );
      results.push({
        privateKey,
        passphrase: passphrase,
        keystore,
      });
    } catch (error) {
      console.log(error);
    }
  }
  fs.writeFileSync('./keystores_redux.json', JSON.stringify(results, null, 2));
}

generateTestKeystores();
