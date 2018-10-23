import {ReqMiddlewareFn} from '../src/util';
export const mockReqMiddleware: ReqMiddlewareFn = req => {
  return {
    ...req,
    payload: {...req.payload, params: [...req.payload.params, 'I am a test']},
  };
};
