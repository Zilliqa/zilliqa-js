export const enum ContractStatus {
  Deployed,
  Rejected,
  Initialised,
}

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
  value: string;
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
  Info: String;
}
