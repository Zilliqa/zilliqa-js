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

import * as zcrypto from '@zilliqa-js/crypto';

export class Account {
  /**
   * fromFile
   *
   * Takes a JSON-encoded keystore and passphrase, returning a fully
   * instantiated Account instance.
   *
   * @param {string} file
   * @param {string} passphrase
   * @returns {Promise<Account>}
   */
  static async fromFile(file: string, passphrase: string): Promise<Account> {
    try {
      const keystore = JSON.parse(file);
      const privateKey = await zcrypto.decryptPrivateKey(passphrase, keystore);

      return new Account(privateKey);
    } catch (err) {
      throw new Error(`Could not decrypt keystore file.`);
    }
  }

  privateKey: string;
  publicKey: string;
  address: string;
  bech32Address: string;

  constructor(privateKey: string) {
    this.privateKey = this.normalizePrivateKey(privateKey);
    this.publicKey = zcrypto.getPubKeyFromPrivateKey(this.privateKey);
    this.address = zcrypto.getAddressFromPublicKey(this.publicKey);
    this.bech32Address = zcrypto.toBech32Address(this.address);
  }

  /**
   * toFile
   *
   * @param {string} passphrase
   * @param {kdf} 'pbkdf2' | 'scrypt'
   * @returns {Promise<string>}
   */
  async toFile(
    passphrase: string,
    kdf: 'pbkdf2' | 'scrypt' = 'scrypt',
  ): Promise<string> {
    if (!passphrase || !passphrase.length) {
      throw new Error('Passphrase cannot have a length of 0');
    }

    const keystore = await zcrypto.encryptPrivateKey(
      kdf,
      this.privateKey,
      passphrase,
    );

    return keystore;
  }

  /**
   * signTransaction
   *
   * @param {Buffer} bytes - the data to be signed
   *
   * @returns {string} - the hex encoded signature. it is a concatenation of
   * the r and s values in hex, each padded to a length of 64.
   */
  signTransaction(bytes: Buffer) {
    return zcrypto.sign(bytes, this.privateKey, this.publicKey);
  }

  private normalizePrivateKey(privateKey: string) {
    return zcrypto.normalizePrivateKey(privateKey);
  }
}
