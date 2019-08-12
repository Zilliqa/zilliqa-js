import { decodeBase58, encodeBase58, normalizePrivateKey } from '../src/util';
import { randomBytes } from '../src/random';
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

  it('should encode and decode to the same strings', () => {
    const b16 = randomBytes(20);
    const b58 = encodeBase58(b16);
    expect(decodeBase58(b58)).toEqual(b16);
  });

  it('should normalise private keys with 0x prefix', () => {
    const noPrefix =
      'af71626e38926401a6d2fd8fdf91c97f785b8fb2b867e7f8a884351e59ee9aa6';
    const withPrefix =
      '0xaf71626e38926401a6d2fd8fdf91c97f785b8fb2b867e7f8a884351e59ee9aa6';
    expect(noPrefix).toEqual(normalizePrivateKey(withPrefix));
  });
});
