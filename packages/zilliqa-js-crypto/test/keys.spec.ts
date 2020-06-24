//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { pairs } from './keypairs.fixtures';
import * as crypto from '../src/index';

describe('keypairs', () => {
  it('should be able to generate a valid 32-byte private key', () => {
    const pk = crypto.schnorr.generatePrivateKey();

    expect(pk).toHaveLength(64);
    expect(crypto.verifyPrivateKey(pk)).toBeTruthy();
  });

  it('should recover a public key from a private key', () => {
    pairs.forEach(({ private: priv, public: expected }) => {
      const actual = crypto.getPubKeyFromPrivateKey(priv);
      expect(actual).toEqual(crypto.compressPublicKey(expected));
    });
  });

  it('should convert a public key to an address', () => {
    pairs.forEach(({ public: pub, digest }) => {
      const expected = crypto.toChecksumAddress(digest.slice(24));
      const actual = crypto.getAddressFromPublicKey(pub);

      expect(actual).toHaveLength(42);
      expect(actual).toEqual(expected);
    });
  });

  it('should be able to recover an address from a private key', () => {
    const [pair] = pairs;
    const expected = crypto.getAddressFromPublicKey(
      crypto.compressPublicKey(pair.public),
    );
    const actual = crypto.getAddressFromPrivateKey(pair.private);

    expect(actual).toHaveLength(42);
    expect(actual).toEqual(expected);
  });

  it('should give the same address for a given public or private key', () => {
    pairs.forEach(({ private: priv, public: pub }) => {
      const fromPrivateKey = crypto.getAddressFromPrivateKey(priv);
      const fromPublicKey = crypto.getAddressFromPublicKey(
        crypto.compressPublicKey(pub),
      );

      expect(fromPrivateKey).toHaveLength(42);
      expect(fromPublicKey).toHaveLength(42);
      expect(fromPublicKey).toEqual(fromPrivateKey);
    });
  });
});
