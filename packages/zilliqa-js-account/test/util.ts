import { HTTPProvider } from '@zilliqa-js/core';
import { Wallet } from '../src/wallet';
import range from 'lodash.range';

export const createWallet = async (
  num: number,
  provider: string = 'https://mock.com',
): Promise<[Wallet, string[]]> => {
  const wallet = new Wallet(new HTTPProvider(provider));
  const addresses: string[] = [];
  await Promise.all(
    range(num).map(async () => {
      await wallet.create();
    }),
  );

  return [wallet, addresses];
};
