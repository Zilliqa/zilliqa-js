import {Emitter} from 'mitt';
import {AxiosPromise} from 'axios';

export type Subscriber = (event: any) => void;
export type Subscribers = Map<SubscriptionToken, Subscriber>;
type SubscriptionToken = symbol;

export interface Provider {
  broadcaster: Emitter;
  subscribers: Subscribers;
  // TODO: strict typing when we have a better idea of how to generalise the
  // payloads sent to lookup nodes - protobuf?
  send<R = any, E = string>(
    method: string,
    ...params: any[]
  ): Promise<RPCResponse<R, E>>;
  subscribe(event: string, subscriber: Subscriber): Symbol;
  unsubscribe(token: Symbol): void;
}

export abstract class Signer {
  abstract sign(payload: Signable): Promise<Signable>;
}

export interface Signable {
  bytes: Buffer;
}

interface RPCBase {
  id: 1;
  jsonrpc: '2.0';
}

export interface RPCRequest extends RPCBase {
  method: string;
  params: any[];
}

export interface RPCResponseSuccess<R = any> extends RPCBase {
  result: R;
}

export interface RPCResponseError<E> extends RPCBase {
  result: {Error: E};
}

export type RPCResponse<R, E> = RPCResponseSuccess<R> | RPCResponseError<E>;

/**
 * ZilliqaModule
 *
 * This interface must be implemented by all top-level modules.
 */
export interface ZilliqaModule {
  provider: Provider;
  signer: Signer;
}
