export const format = <TI extends Function, TO extends Function>(
  input: TI,
  output: TO,
) => (target: any, key: any, descriptor: PropertyDescriptor) => {
  descriptor.value = (...inArgs: any[]): string => {
    const rawOutput = descriptor.value(input(...inArgs));
    return output(rawOutput);
  };
};
