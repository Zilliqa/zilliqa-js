import { decodeBase58, encodeBase58 } from '../src/util';
import testCases from './b58.fixtures.json';

describe('crypto utils', () => {
  it('should encode base 16 strings in base 58 correctly', () => {
    testCases.forEach(([input, expected]) => {
      const actual = encodeBase58(input);
      expect(actual).toEqual(expected);
    });
  });

  it('should decode base 58 strings to base 16 correctly', () => {
    testCases.forEach(([expected, input]) => {
      const actual = decodeBase58(input);
      expect(actual).toEqual(expected);
    });
  });
});
