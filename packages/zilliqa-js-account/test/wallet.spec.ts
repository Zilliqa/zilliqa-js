import BN from 'bn.js';

import { HTTPProvider } from '@zilliqa-js/core';
import {
  getPubKeyFromPrivateKey,
  generatePrivateKey,
  schnorr,
} from '@zilliqa-js/crypto';

import fetch from 'jest-fetch-mock';

import { createWallet } from './util';
import { Account } from '../src/account';
import { Wallet } from '../src/wallet';
import { Transaction } from '../src/transaction';

const provider = new HTTPProvider('https://mock.com');

describe('Wallet', () => {
  afterEach(() => {
    fetch.resetMocks();
  });

  it('should be able to bootstrap with an array of Accounts ', () => {
    const accounts: Account[] = [];
    for (let i = 0; i < 10; i++) {
      accounts.push(new Account(generatePrivateKey()));
    }

    const wallet = new Wallet(provider, accounts);
    expect(Object.keys(wallet.accounts).length).toEqual(10);
  });

  it('should be able to bootstrap from a mnemonic', async () => {
    const mnemonic =
      'cart hat drip lava jelly keep device journey bean mango rocket festival';
    const wallet = new Wallet(provider);
    const addresses = [];
    for (let i = 0; i < 10; i++) {
      const address = await wallet.addByMnemonic(mnemonic, i);
      addresses.push(address);
    }
    expect(Object.keys(wallet.accounts).length).toEqual(10);
    expect(Object.keys(wallet.accounts).sort()).toEqual(addresses.sort());
    expect(Object.keys(wallet.accounts).sort()).toEqual([
      '01d12dc972d0c5c8c32d356944926cd43f627efc',
      '02346211a65964e35b05adae342ff966baec7ba4',
      '24729a40ebb8b42550276b44a3a7dc81645c972d',
      '3093240469df6ae2c2a25883b550f0677a689da4',
      '546c5dda129fb0d352c5de66f32d8d0e4bc89041',
      '64f0d859455b45947c6a8c22ce73bf3ec90fdb9d',
      '6ecdec7d36071ae28f00b4067167c3a75c87be20',
      'cd1eb2531cc4abf0b19a5163c2fa16b1cffebe87',
      'd836fcdaa723c7ba2daba0b1898060b8dffae592',
      'ef6f3e6c15bd0ced75a857795a5e86bd4ff50c78',
    ]);
  });

  it('should be able to export a json keystore', async () => {
    const [walletA, [address]] = createWallet(1);
    const keystore = await walletA.export(address, 'stronk');
    const [walletB] = createWallet(0);
    const importedAddress = await walletB.addByKeystore(keystore, 'stronk');

    expect(importedAddress).toEqual(address);
  });

  it('should sign transactions with the default account', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: new BN(1000),
        pubKey,
      },
      provider,
    );

    fetch.once(
      JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      }),
    );

    const signed = await wallet.sign(tx);
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lgtm).toBeTruthy();
  });

  it('should respect the supplied nonce, if any', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 0,
        nonce: 888,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(888),
        gasPrice: new BN(888),
        gasLimit: new BN(888),
        pubKey,
      },
      provider,
    );

    const signed = await wallet.sign(tx);
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(lgtm).toBeTruthy();
  });

  it('should throw an error if asked to sign with no accounts available', () => {
    const pubKey = getPubKeyFromPrivateKey(generatePrivateKey());
    const [wallet] = createWallet(0);

    const tx = new Transaction(
      {
        version: 1,
        nonce: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: new BN(1000),
        pubKey,
      },
      provider,
    );

    try {
      wallet.sign(tx);
    } catch (err) {
      expect(err.message).toEqual('This wallet has no default account.');
    }
  });
});
