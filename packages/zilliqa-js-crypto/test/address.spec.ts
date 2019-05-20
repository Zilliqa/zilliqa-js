import { addresses } from './address.fixtures';
import { checksummedStore } from './checksum.fixtures';
import * as crypto from '../src/index';

describe('addresses', () => {
  it('should produce the same results as the C++ keygen crypto', () => {
    addresses.forEach(({ public: pub, private: priv, address }) => {
      const generatedPub = crypto.getPubKeyFromPrivateKey(priv);
      const addressFromPriv = crypto.getAddressFromPrivateKey(priv);
      const addressFromPub = crypto.getAddressFromPrivateKey(priv);

      expect(generatedPub.toUpperCase()).toEqual(pub);
      expect(addressFromPriv.toUpperCase()).toEqual(address);
      expect(addressFromPub.toUpperCase()).toEqual(address);
    });
  });

  it('should return a valid 0x prefixed checksummed address', () => {
    checksummedStore.forEach(({ original: address, zil: expected }) => {
      const actual = crypto.toChecksumAddress(address);
      expect(actual).toEqual(expected);
      expect(actual.substr(0, 2)).toEqual('0x');
    });
  });

  it('should return true when a valid checksummed address is tested', () => {
    checksummedStore.forEach(({ zil: checksummed }) => {
      const actual = crypto.isValidChecksumAddress(checksummed);
      expect(actual).toBeTruthy();
    });
  });

  it('should return false when an invalid checksummed address is tested', () => {
    checksummedStore.forEach(({ eth: badlychecksummed }) => {
      const actual = crypto.isValidChecksumAddress(badlychecksummed);
      expect(actual).toBeFalsy();
    });
  });

  it('should encode and decode to and from bech32', () => {
    const b16 = crypto.randomBytes(20);
    const b32 = crypto.toBech32Address(b16);
    expect(crypto.fromBech32Address(b32)).toEqual(
      crypto.toChecksumAddress(b16),
    );
  });
});
