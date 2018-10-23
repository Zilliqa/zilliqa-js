import {RPCMethod} from '../net';
import {Provider} from '../types';
import {Matcher, ReqMiddlewareFn, ResMiddlewareFn} from '../util';

const enum MiddlewareType {
  REQ,
  RES,
}

export default class BaseProvider {
  protected nodeURL: string;
  protected reqMiddleware: Map<Matcher, ReqMiddlewareFn[]>;
  protected resMiddleware: Map<Matcher, ResMiddlewareFn[]>;

  middleware = {
    request: {
      use: <I, O>(fn: ReqMiddlewareFn<I, O>, match: Matcher = '*') => {
        this.pushMiddleware<MiddlewareType.REQ>(fn, MiddlewareType.REQ, match);
      },
    },
    response: {
      use: <I, O, E>(fn: ResMiddlewareFn<I, O, E>, match: Matcher = '*') => {
        this.pushMiddleware<MiddlewareType.RES>(fn, MiddlewareType.RES, match);
      },
    },
  };

  constructor(
    nodeURL: string,
    reqMiddleware: Map<Matcher, ReqMiddlewareFn[]> = new Map(),
    resMiddleware: Map<Matcher, ResMiddlewareFn[]> = new Map(),
  ) {
    this.nodeURL = nodeURL;
    this.reqMiddleware = reqMiddleware;
    this.resMiddleware = resMiddleware;
  }

  /**
   * pushMiddleware
   *
   * Adds the middleware to the appropriate middleware map.
   *
   * @param {ResMiddlewareFn}
   * @param {T} type
   * @param {Matcher} match
   * @returns {void}
   */
  protected pushMiddleware<T extends MiddlewareType>(
    fn: T extends MiddlewareType.REQ ? ReqMiddlewareFn : ResMiddlewareFn,
    type: T,
    match: Matcher,
  ): void {
    if (type !== MiddlewareType.REQ && type !== MiddlewareType.RES) {
      throw new Error('Please specify the type of middleware being added');
    }
    if (type === MiddlewareType.REQ) {
      const current = this.reqMiddleware.get(match) || [];
      this.reqMiddleware.set(match, [...current, <ReqMiddlewareFn>fn]);
    } else {
      const current = this.resMiddleware.get(match) || [];
      this.resMiddleware.set(match, [...current, <ResMiddlewareFn>fn]);
    }
  }

  /**
   * getMiddleware
   *
   * Returns the middleware that matches the matcher provided. Note that
   * middleware are called in order of specificity: string -> regexp ->
   * wildcard.
   *
   * @param {Matcher} match
   * @returns {[ReqMiddlewareFn[], ResMiddlewareFn[]]}
   */
  protected getMiddleware(
    method: RPCMethod,
  ): [ReqMiddlewareFn[], ResMiddlewareFn[]] {
    const reqFns: ReqMiddlewareFn[] = [];
    const resFns: ResMiddlewareFn[] = [];

    for (const [key, transformers] of this.reqMiddleware.entries()) {
      if (typeof key === 'string' && key !== '*') {
        reqFns.push(...transformers);
      }

      if (key instanceof RegExp && key.test(method)) {
        reqFns.push(...transformers);
      }

      if (key === '*') {
        reqFns.push(...transformers);
      }
    }

    for (const [key, transformers] of this.resMiddleware.entries()) {
      if (typeof key === 'string') {
        resFns.push(...transformers);
      }

      if (key instanceof RegExp && key.test(method)) {
        resFns.push(...transformers);
      }

      if (key === '*') {
        resFns.push(...transformers);
      }
    }

    return [reqFns, resFns];
  }
}
