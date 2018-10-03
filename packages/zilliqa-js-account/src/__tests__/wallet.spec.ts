import BN from 'bn.js';
import hash from 'hash.js';
import {
  getPubKeyFromPrivateKey,
  generatePrivateKey,
  schnorr,
} from 'zilliqa-js-crypto';
import {createWallet} from './util';
import Account from '../account';
import Wallet from '../wallet';
import Transaction from '../transaction';

describe('Module: Wallet', () => {
  it('should be able to bootstrap with an array of Accounts ', () => {
    const accounts: Account[] = [];
    for (let i = 0; i < 10; i++) {
      accounts.push(new Account(generatePrivateKey()));
    }

    const wallet = new Wallet(accounts);
    expect(Object.keys(wallet.accounts).length).toEqual(10);
  });

  // it('should be able to bootstrap from a mnemonic', () => {});

  it('should be able to export a json keystore', async () => {
    const [walletA, [address]] = createWallet(1);
    const keystore = await walletA.export(address, 'stronk');
    const [walletB] = createWallet(0);
    const importedAddress = await walletB.addByKeystore(keystore, 'stronk');

    expect(importedAddress).toEqual(address);
  });

  it('should sign transactions with the default account', () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction({
      version: 1,
      nonce: 1,
      to: '0x1234567890123456789012345678901234567890',
      amount: new BN(0),
      gasPrice: 1000,
      gasLimit: 1000,
      pubKey,
    });

    const bytes = tx.bytes;
    const signed = wallet.sign(tx);
    const signature = schnorr.toSignature(signed.return().signature as string);
    const lgtm = schnorr.verify(bytes, signature, Buffer.from(pubKey, 'hex'));

    expect(lgtm).toBeTruthy();
  });

  it('should throw an error if asked to sign with no accounts available', () => {
    const pubKey = getPubKeyFromPrivateKey(generatePrivateKey());
    const [wallet] = createWallet(0);

    const tx = new Transaction({
      version: 1,
      nonce: 1,
      to: '0x1234567890123456789012345678901234567890',
      amount: new BN(0),
      gasPrice: 1000,
      gasLimit: 1000,
      pubKey,
    });

    try {
      wallet.sign(tx);
    } catch (err) {
      expect(err.message).toEqual('This wallet has no default account.');
    }
  });
});
