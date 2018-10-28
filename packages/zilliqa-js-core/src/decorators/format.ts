import { ZilliqaModule } from '../types';

type InputFn<T> = (arg: T) => any;
type OutputFn<T> = (arg: any) => T;

type Identity<T> = (arg: T) => T;
const id = <T>(x: T) => x;

export const format = <TI, TO>(
  input: InputFn<TI> = id,
  output: OutputFn<TO> = id,
) => (target: any, key: any, descriptor: PropertyDescriptor) => {
  const original = descriptor.value;
  function interceptor(this: ZilliqaModule, arg: TI) {
    console.log(arg);
    const formattedInput = input(arg);
    const raw = original.call(this, formattedInput);

    return output(raw);
  }

  if (original) {
    descriptor.value = interceptor;
    return descriptor;
  }
};
