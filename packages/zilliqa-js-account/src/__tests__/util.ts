import Wallet from '../wallet';

export const createWallet = (num: number): [Wallet, string[]] => {
  const wallet = new Wallet();
  const addresses = [];

  for (let i = 0; i < num; i++) {
    addresses.push(wallet.create());
  }

  return [wallet, addresses];
};
