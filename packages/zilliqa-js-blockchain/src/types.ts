export interface TransactionObj {
  ID: string;
  version: string;
  nonce: string;
  toAddr: string;
  amount: string;
  signature: string;
  receipt: TransactionObj;
}

export interface TransactionReceiptObj {
  success: boolean;
  cumulative_gas: string;
  event_logs: EventLogEntry[];
}

export interface EventLogEntry {
  address: string;
  _eventname: string;
  params: EventParam[];
}

export interface EventParam {
  vname: string;
  type: string;
  value: string;
}
