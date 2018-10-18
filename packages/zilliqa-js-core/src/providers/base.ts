import {MiddlewareFn} from '../types';

const enum MiddlewareType {
  REQ,
  RES,
}

export default class BaseProvider {
  protected reqMiddleware: MiddlewareFn[];
  protected resMiddleware: MiddlewareFn[];

  middleware = {
    request: {
      use: (fn: MiddlewareFn) => this.pushMiddleware(fn, MiddlewareType.REQ),
    },
    response: {
      use: (fn: MiddlewareFn) => this.pushMiddleware(fn, MiddlewareType.RES),
    },
  };

  constructor(
    reqMiddleware: MiddlewareFn[] = [],
    resMiddleware: MiddlewareFn[] = [],
  ) {
    this.reqMiddleware = reqMiddleware;
    this.resMiddleware = resMiddleware;
  }

  protected pushMiddleware(fn: MiddlewareFn, type: MiddlewareType) {
    if (type === MiddlewareType.REQ) {
      this.reqMiddleware = [...this.reqMiddleware, fn];
    } else {
      this.reqMiddleware = [...this.resMiddleware, fn];
    }
  }
}
