export enum ChainID {
  MainNet = 0,
  TestNet = 333,
}
export enum ChainType {
  MainNet = 'MainNet',
  TestNet = 'TestNet',
}
export interface ZilConfig {
  chainType: ChainType;
  endpoint: string;
}
