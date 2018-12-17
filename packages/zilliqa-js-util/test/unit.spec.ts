import BN from 'bn.js';
import * as denom from '../src/unit';

describe('Unit utils', () => {
  it('should convert Qa to Zil', () => {
    const qa = new BN(1_000_000_000_000);
    const expected = '1';

    expect(denom.fromQa(qa, denom.Units.Zil)).toEqual(expected);
  });

  it('should convert Qa to Li', () => {
    const qa = new BN(1_000_000);
    const expected = '1';

    expect(denom.fromQa(qa, denom.Units.Li)).toEqual(expected);
  });

  it('should convert Li to Qa', () => {
    const li = new BN(1);
    const expected = new BN(1_000_000);

    expect(denom.toQa(li, denom.Units.Li).eq(expected)).toBeTruthy();
  });

  it('should convert Zil to Qa', () => {
    const zil = new BN(1);
    const expected = new BN(1_000_000_000_000);

    expect(denom.toQa(zil, denom.Units.Zil).eq(expected)).toBeTruthy();
  });

  it('fromQa should should work for negative numbers', () => {
    const qa = new BN(-1_000_000_000_000);
    const expected = '-1';

    expect(denom.fromQa(qa, denom.Units.Zil)).toEqual(expected);
  });

  it('toQa should should work for negative numbers', () => {
    const zil = new BN(-1);
    const expected = new BN(-1000000000000);

    expect(denom.toQa(zil, denom.Units.Zil)).toEqual(expected);
  });
});
