import {ZilliqaModule, Signable} from '../types';

export const sign = <T extends typeof ZilliqaModule>(target: T) => {
  if (!target.prototype.provider || !target.prototype.signer) {
    return target;
  }

  const sendFn = target.prototype.provider.send;

  const wrappedSigner = (method: string, payload: Signable) => {
    if (method === 'CreateTransaction') {
      const signed = target.prototype.signer.sign(payload);
      return target.prototype.provider.send(method, signed);
    }

    return target.prototype.provider.send(method, payload);
  };
};
