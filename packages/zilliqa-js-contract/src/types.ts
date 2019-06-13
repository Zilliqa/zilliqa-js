import { Omit } from 'utility-types';
import { TxParams } from '@zilliqa-js/account';

export const enum ContractStatus {
  Deployed,
  Rejected,
  Initialised,
}

export type DeployParams = Omit<
  TxParams,
  'toAddr' | 'amount' | 'code' | 'data' | 'receipt' | 'signature'
>;

export type CallParams = Omit<
  TxParams,
  'toAddr' | 'data' | 'code' | 'receipt' | 'signature'
>;

export interface ContractObj {
  address: string;
  abi: ABI;
  init: any;
  state: any;
}

export interface Transition {
  name: string;
  params: Field[];
}

export interface ABI {
  name: string;
  fields: Field[];
  params: Field[];
  transitions: Transition[];
}

export interface Field {
  name: string;
  type: string;
}

export interface Value {
  vname: string;
  type: string;
  value: string | ADTValue;
}

interface ADTValue {
  constructor: string;
  argtypes: string[];
  arguments: Value[];
}

export type Param = Value;
export type TransitionParam = Value;

export type Init = Value[];

export type State = Value[];

export interface TransitionPayload {
  // the name of the transtion to be called
  _tag: string;
  // amount to send to the contract, if any
  _amount: string;
  params: Value[];
}

// RPC Error Responses
export type DeployError =
  | 'Code is empty and To addr is null'
  | 'To Addr is null'
  | 'Non - contract address called'
  | 'Could not create Transaction'
  | 'Unable to process';

export interface DeploySuccess {
  TranID: string;
  Info: string;
  ContractAddress: string;
}
