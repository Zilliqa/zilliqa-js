import { addresses } from './address.fixtures';
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
});
