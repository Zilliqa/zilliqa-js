import {Provider} from '../types';
import {ReqMiddlewareFn, ResMiddlewareFn} from '../util';

const enum MiddlewareType {
  REQ,
  RES,
}

export default class BaseProvider  {
  protected reqMiddleware: ReqMiddlewareFn[];
  protected resMiddleware: ResMiddlewareFn[];

  middleware = {
    request: {
      use: <I, O>(fn: ReqMiddlewareFn<I, O>) => {
        this.pushMiddleware<MiddlewareType.REQ>(fn, MiddlewareType.REQ);
      },
    },
    response: {
      use: <I, O, E>(fn: ResMiddlewareFn<I, O, E>) => {
        this.pushMiddleware<MiddlewareType.RES>(fn, MiddlewareType.RES);
      },
    },
  };

  constructor(
    reqMiddleware: ReqMiddlewareFn[] = [],
    resMiddleware: ResMiddlewareFn[] = [],
  ) {
    this.reqMiddleware = reqMiddleware;
    this.resMiddleware = resMiddleware;
  }

  protected pushMiddleware<T extends MiddlewareType>(
    fn: T extends MiddlewareType.REQ ? ReqMiddlewareFn : ResMiddlewareFn,
    type: T,
  ): void {
    if (type === MiddlewareType.REQ) {
      this.reqMiddleware = [...this.reqMiddleware, <ReqMiddlewareFn>fn];
    } else {
      this.resMiddleware = [...this.resMiddleware, <ResMiddlewareFn>fn];
    }
  }
}
