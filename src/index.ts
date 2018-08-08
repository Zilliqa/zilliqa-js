import Zilliqa from './zilliqa';
export { default as Zilliqa } from './zilliqa';

if (typeof window !== 'undefined' && typeof window.Zilliqa === 'undefined') {
  window.Zilliqa = Zilliqa;
}

