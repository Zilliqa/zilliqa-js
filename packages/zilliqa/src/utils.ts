export enum ChainID {
  MainNet = 0,
  TestNet = 333,
}
export const ChainType = Object.freeze({
  MainNet: 'MainNet',
  TestNet: 'TestNet',
});
export interface ZilConfig {
  chainID: ChainID;
  endpoint: string;
}
