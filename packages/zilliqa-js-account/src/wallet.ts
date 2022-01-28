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

import bip39 from 'bip39';
import hdkey from 'hdkey';
import { Signer, Provider, RPCMethod } from '@zilliqa-js/core';
import * as zcrypto from '@zilliqa-js/crypto';

import { Account } from './account';
import { Transaction } from './transaction';
import { BN } from '@zilliqa-js/util';

export class Wallet extends Signer {
  accounts: { [address: string]: Account } = {};
  defaultAccount?: Account;
  provider: Provider;

  /**
   * constructor
   *
   * Takes an array of Account objects and instantiates a Wallet instance.
   *
   * @param {Account[]} accounts
   */
  constructor(provider: Provider, accounts: Account[] = []) {
    super();
    if (accounts.length) {
      this.accounts = accounts.reduce((acc, account) => {
        return { ...acc, [account.address]: account };
      }, {} as any);
    }

    this.provider = provider;
    this.defaultAccount = accounts[0];
  }

  /**
   * create
   *
   * Creates a new keypair with a randomly-generated private key. The new
   * account is accessible by address.
   *
   * @returns {string} - address of the new account
   */
  create(): string {
    const privateKey = zcrypto.schnorr.generatePrivateKey();
    const newAccount = new Account(privateKey);

    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * addByPrivateKey
   *
   * Adds an account to the wallet by private key.
   *
   * @param {string} privateKey - hex-encoded private key
   * @returns {string} - the corresponing address, computer from the private
   * key.
   */
  addByPrivateKey(privateKey: string): string {
    const newAccount = new Account(privateKey);
    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * addByKeystore
   *
   * Adds an account by keystore. This method is asynchronous and returns
   * a Promise<string>, in order not to block on the underlying decryption
   * operation.
   *
   * @param {string} keystore
   * @param {string} passphrase
   * @returns {Promise<string>}
   */
  async addByKeystore(keystore: string, passphrase: string): Promise<string> {
    const newAccount = await Account.fromFile(keystore, passphrase);
    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * addByMnemonic
   *
   * Adds an `Account` by use of a mnemonic as specified in BIP-32 and BIP-39
   *
   * @param {string} phrase - 12-word mnemonic phrase
   * @param {number} index=0 - the number of the child key to add
   * @returns {string} - the corresponding address
   */
  addByMnemonic(phrase: string, index: number = 0): string {
    if (!this.isValidMnemonic(phrase)) {
      throw new Error(`Invalid mnemonic phrase: ${phrase}`);
    }
    const seed = bip39.mnemonicToSeed(phrase);
    const hdKey = hdkey.fromMasterSeed(seed);
    const childKey = hdKey.derive(`m/44'/313'/0'/0/${index}`);
    const privateKey = childKey.privateKey.toString('hex');
    return this.addByPrivateKey(privateKey);
  }

  /**
   * addByMnemonicLedger
   *
   * Adds an `Account` by use of a mnemonic as specified in BIP-32 and BIP-39
   * The key derivation path used in Ledger is different from that of
   * addByMnemonic.
   *
   * @param {string} phrase - 12-word mnemonic phrase
   * @param {number} index=0 - the number of the child key to add
   * @returns {string} - the corresponding address
   */
  addByMnemonicLedger(phrase: string, index: number = 0): string {
    if (!this.isValidMnemonic(phrase)) {
      throw new Error(`Invalid mnemonic phrase: ${phrase}`);
    }
    const seed = bip39.mnemonicToSeed(phrase);
    const hdKey = hdkey.fromMasterSeed(seed);
    const childKey = hdKey.derive(`m/44'/313'/${index}'/0'/0'`);
    const privateKey = childKey.privateKey.toString('hex');
    return this.addByPrivateKey(privateKey);
  }

  /**
   * export
   *
   * Exports the specified account as a keystore file.
   *
   * @param {string} address
   * @param {string} passphrase
   * @param {KDF} kdf='scrypt'
   * @returns {Promise<string>}
   */
  export(
    address: string,
    passphrase: string,
    kdf: zcrypto.KDF = 'scrypt',
  ): Promise<string> {
    if (!this.accounts[address]) {
      throw new Error(`No account with address ${address} exists`);
    }

    return this.accounts[address].toFile(passphrase, kdf);
  }

  /**
   * remove
   *
   * Removes an account from the wallet and returns boolean to indicate
   * failure or success.
   *
   * @param {string} address
   * @returns {boolean}
   */
  remove(address: string): boolean {
    if (this.accounts[address]) {
      const { [address]: toRemove, ...rest } = this.accounts;

      this.accounts = rest;
      return true;
    }

    return false;
  }

  /**
   * setDefault
   *
   * Sets the default account of the wallet.
   *
   * @param {string} address
   */
  setDefault(address: string) {
    this.defaultAccount = this.accounts[address];
  }

  /**
   * sign
   *
   * signs an unsigned transaction with the default account.
   *
   * @param {Transaction} tx
   * @param {boolean} offlineSign
   * @returns {Transaction}
   */
  sign(tx: Transaction, offlineSign?: boolean): Promise<Transaction> {
    if (tx.txParams && tx.txParams.pubKey) {
      // attempt to find the address
      const senderAddress = zcrypto.getAddressFromPublicKey(tx.txParams.pubKey);

      if (!this.accounts[senderAddress]) {
        throw new Error(
          `Could not sign the transaction with ${senderAddress} as it does not exist`,
        );
      }

      return this.signWith(tx, senderAddress, offlineSign);
    }

    if (!this.defaultAccount) {
      throw new Error('This wallet has no default account.');
    }

    return this.signWith(tx, this.defaultAccount.address, offlineSign);
  }

  async signBatch(txList: Transaction[]): Promise<Transaction[]> {
    const batchResults = [];
    if (!this.defaultAccount) {
      throw new Error('This wallet has no default account.');
    }

    try {
      // nonce is assumed to come from default account
      const signer = this.accounts[this.defaultAccount.address];
      const balance = await this.provider.send(
        RPCMethod.GetBalance,
        signer.address.replace('0x', '').toLowerCase(),
      );

      if (balance.result === undefined) {
        throw new Error('Could not get balance');
      }

      if (typeof balance.result.nonce !== 'number') {
        throw new Error('Could not get nonce');
      }

      const nextNonce = balance.result.nonce + 1;

      for (let index = 0; index < txList.length; index++) {
        // increment nonce for each new transaction
        const currentNonce = index + nextNonce;
        const withNonceTx = txList[index].map((txObj) => {
          return {
            ...txObj,
            nonce: currentNonce,
            pubKey: signer.publicKey,
          };
        });
        const signedTx = await this.sign(withNonceTx);
        batchResults.push(signedTx);
      }
    } catch (err) {
      throw err;
    }
    return batchResults;
  }

  /**
   * signWith
   *
   * @param {Transaction} tx
   * @param {string} account
   * @param {boolean} offlineSign
   * @returns {Transaction}
   */
  async signWith(
    tx: Transaction,
    account: string,
    offlineSign?: boolean,
  ): Promise<Transaction> {
    if (!this.accounts[account]) {
      throw new Error(
        'The selected account does not exist on this Wallet instance.',
      );
    }

    const signer = this.accounts[account];
    const gasPrice = tx.txParams.gasPrice;
    const gasLimit = new BN(tx.txParams.gasLimit.toString());
    const debt = gasPrice.mul(gasLimit).add(tx.txParams.amount);
    let currNonce: number = 0;

    try {
      if (!tx.txParams.nonce) {
        if (offlineSign) {
          throw new Error(
            'No nonce detected in tx params when signing in offline mode',
          );
        }

        if (typeof offlineSign === 'undefined' || !offlineSign) {
          // retrieve latest nonce
          const balance = await this.provider.send(
            RPCMethod.GetBalance,
            signer.address.replace('0x', '').toLowerCase(),
          );

          if (balance.result === undefined) {
            throw new Error('Could not get balance');
          }

          const bal = new BN(balance.result.balance);
          if (debt.gt(bal)) {
            throw new Error(
              'You do not have enough funds, need ' +
                debt.toString() +
                ' but only have ' +
                bal.toString(),
            );
          }

          if (typeof balance.result.nonce !== 'number') {
            throw new Error('Could not get nonce');
          }

          currNonce = balance.result.nonce;
        }

        const withNonce = tx.map((txObj) => {
          return {
            ...txObj,
            nonce: txObj.nonce || currNonce + 1,
            pubKey: signer.publicKey,
          };
        });

        return withNonce.map((txObj) => {
          // @ts-ignore
          return {
            ...txObj,
            signature: signer.signTransaction(withNonce.bytes),
          };
        });
      }

      const withPublicKey = tx.map((txObj) => {
        return {
          ...txObj,
          pubKey: signer.publicKey,
        };
      });

      return withPublicKey.map((txObj) => {
        return {
          ...txObj,
          signature: signer.signTransaction(tx.bytes),
        };
      });
    } catch (err) {
      throw err;
    }
  }

  private isValidMnemonic(phrase: string): boolean {
    if (phrase.trim().split(/\s+/g).length < 12) {
      return false;
    }
    return bip39.validateMnemonic(phrase);
  }
}
