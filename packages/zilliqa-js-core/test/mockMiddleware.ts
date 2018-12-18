import { ReqMiddlewareFn, ResMiddlewareFn } from '../src/util';

export const mockReqMiddleware: ReqMiddlewareFn = (req) => {
  return {
    ...req,
    payload: { ...req.payload, params: [...req.payload.params, 'I am a test'] },
  };
};

export const mockResMiddleware: ResMiddlewareFn<string, string, never> = (
  res,
) => {
  if (res.result && typeof res.result === 'string') {
    return { ...res, result: res.result.toUpperCase() };
  }

  return res;
};
