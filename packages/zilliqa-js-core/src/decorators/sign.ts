import {Signable, ZilliqaModule} from '../types';

/**
 * sign
 *
 * This decorates a method by attempting to sign the first argument of the
 * intercepted method.
 *
 * @param {T} target
 * @param {K} key
 * @param {PropertyDescriptor} descriptor
 * @returns {PropertyDescriptor | undefined}
 */
export const sign = <T, K extends keyof T>(
  target: T,
  key: K,
  descriptor: PropertyDescriptor,
) => {
  const original = descriptor.value;

  if (!original) {
    return;
  }

  function interceptor(this: ZilliqaModule, arg: Signable): any {
    const signed = this.signer.sign(arg);
    return original ? original.call(this, signed) : undefined;
  }

  descriptor.value = interceptor;
  return descriptor;
};
