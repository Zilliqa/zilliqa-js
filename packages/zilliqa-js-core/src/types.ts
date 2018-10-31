import { RPCRequest, RPCResponse } from './net';
import { Middleware } from './util';

export type Subscriber = (event: any) => void;
export type Subscribers = Map<SubscriptionToken, Subscriber>;
type SubscriptionToken = symbol;

export interface Provider {
  middleware: Middleware;
  // TODO: strict typing when we have a better idea of how to generalise the
  // payloads sent to lookup nodes - protobuf?
  send<R = any, E = string>(
    method: string,
    ...params: any[]
  ): Promise<RPCResponse<R, E>>;
  subscribe?(event: string, subscriber: Subscriber): Symbol;
  unsubscribe?(token: Symbol): void;
}

export abstract class Signer {
  abstract sign(payload: Signable): Promise<Signable>;
}

export interface Signable {
  bytes: Buffer;
}

/**
 * ZilliqaModule
 *
 * This interface must be implemented by all top-level modules.
 */
export interface ZilliqaModule {
  provider: Provider;
  signer: Signer;
}
