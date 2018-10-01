import {ZilliqaModule, Signable} from '../types';

export const sign = (target: ZilliqaModule) => {
  if (!target.provider || !target.signer) {
    return target;
  }

  const sendFn = target.provider.send;

  const wrappedSigner = (method: string, payload: Signable) => {
    if (method === 'CreateTransaction') {
      const signed = target.signer.sign(payload);
      return target.provider.send(method, signed);
    }

    return target.provider.send(method, payload);
  };
};
