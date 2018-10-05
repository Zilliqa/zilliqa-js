export interface ContractObj {
  address: string;
  abi: ABI;
  init: any;
  state: any;
}

export interface ABI {
  name: string;
  fields: Field[];
  params: Param[];
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

export type Param = Field;
export type TransitionParam = Field;

export type Init = Value[];
export type State = Value[];

export interface Transition {
  name: string;
  params: TransitionParam[];
}
