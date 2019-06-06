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

  it('should be able to bootstrap with an array of Accounts ', async () => {
    const accounts: Account[] = [];
    for (let i = 0; i < 10; i++) {
      accounts.push(new Account());
    }

    await Promise.all(
      accounts.map(async (account) => {
        await account.create();
      }),
    );

    const wallet = new Wallet(provider, accounts);
    expect(Object.keys(wallet.accounts).length).toEqual(10);
  });

  it('should sign transactions with the default account', async () => {
    const [wallet] = await createWallet(1);
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
    const [wallet] = await createWallet(1);
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

  it('should throw an error if asked to sign with no accounts available', async () => {
    const pubKey = getPubKeyFromPrivateKey(schnorr.generatePrivateKey());
    const [wallet] = await createWallet(0);

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
