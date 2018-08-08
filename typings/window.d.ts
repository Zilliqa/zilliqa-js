import Zilliqa from '../src/zilliqa';

declare global {
  interface Window {
    Zilliqa: typeof Zilliqa;
  }
}
