import { Provider, HTTPProvider } from '@zilliqa-js/core';
import Wallet from '../src/wallet';

export const createWallet = (
  num: number,
  provider: string = 'https://mock.com',
): [Wallet, string[]] => {
  const wallet = new Wallet(new HTTPProvider(provider));
  const addresses = [];

  for (let i = 0; i < num; i++) {
    addresses.push(wallet.create());
  }

  return [wallet, addresses];
};
