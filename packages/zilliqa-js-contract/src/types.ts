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

export type Param = Field;
export type TransitionParam = Field;

export interface Transition {
  name: string;
  params: TransitionParam[];
}


