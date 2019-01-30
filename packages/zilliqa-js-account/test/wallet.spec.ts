import { HTTPProvider } from '@zilliqa-js/core';
import { getPubKeyFromPrivateKey, schnorr } from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

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
      accounts.push(new Account(schnorr.generatePrivateKey()));
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
      "0237f40d30d3c37c9b77577acbb11c972cc58664", 
      "0723dd96243491ee84a925edb657f24582aec899", 
      "4878d8eb9a63493a6de066eb1458cab672dc8cfd", 
      "68275607e8bdf7cfa248b5f5a07b576f9ef39cd1", 
      "852f52532c3c928269bdd3b83ac88e25a04d6b3b", 
      "9165ae9ceeb155fb75d9c1fee2041f12c6e1f5ea", 
      "aacdf9c84bba51878c8681c72f035b62135d6d7e", 
      "bea456fb58094be1c7f99bb6d1584dcec642b0b0", 
      "cd6cb5bc8f3ee8ff7a91b060ce341feb6fc40e21", 
      "ecd9d875c7366432a7ce403a7702dfa3e7f09602"
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
        gasLimit: Long.fromNumber(1000),
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
        gasLimit: Long.fromNumber(888),
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
    const pubKey = getPubKeyFromPrivateKey(schnorr.generatePrivateKey());
    const [wallet] = createWallet(0);

    const tx = new Transaction(
      {
        version: 1,
        nonce: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    expect(() => wallet.sign(tx)).toThrow();
  });
});
