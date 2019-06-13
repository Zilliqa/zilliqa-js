import { PRESETS } from '../src/';

describe('Expect PRESETS', () => {
  it('should test preset types', () => {
    expect(typeof PRESETS.DEVNET_CHAIN_ID).toEqual('number');
    expect(typeof PRESETS.MAINNET_CHAIN_ID).toEqual('number');
    expect(typeof PRESETS.DEVNET_URL).toEqual('string');
    expect(typeof PRESETS.MAINNET_URL).toEqual('string');
    expect(typeof PRESETS.DEVNET_VERSION).toEqual('number');
    expect(typeof PRESETS.MAINNET_VERSION).toEqual('number');
    expect(typeof PRESETS.MSG_VERSION).toEqual('number');
  });
});
