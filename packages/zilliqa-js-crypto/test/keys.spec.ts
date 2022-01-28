//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
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

import * as crypto from '../src/index';

export const pairs = [
  {
    private: 'b776d8f068d11b3c3f5b94db0fb30efea05b73ddb9af1bbd5da8182d94245f0b',
    public:
      '04cfa555bb63231d167f643f1a23ba66e6ca1458d416ddb9941e95b5fd28df0ac513075403c996efbbc15d187868857e31cf7be4d109b4f8cb3fd40499839f150a',
    digest: '0e3e927f8be54eb20f4f47baa2f4d23649433591ea1b967127b971de2288609e',
  },
  {
    private: '24180e6b0c3021aedb8f5a86f75276ee6fc7ff46e67e98e716728326102e91c9',
    public:
      '04163fa604c65aebeb7048c5548875c11418d6d106a20a0289d67b59807abdd299d4cf0efcf07e96e576732dae122b9a8ac142214a6bc133b77aa5b79ba46b3e20',
    digest: 'f5b2dfddfdbd0d13a67085a5ad5744c0c6246d9704592116fccbf41978fe99c8',
  },
  {
    private: 'af71626e38926401a6d2fd8fdf91c97f785b8fb2b867e7f8a884351e59ee9aa6',
    public:
      '0485c34ff11ea1e06f44d35afe3cc1748b6b122bb06df021a4767db4ef5fbcf1cdbed73c821d89724b59a0fc5e2f2e3e1a9c121d698fff36d750ee463117438a14',
    digest: 'f8b9842a5f695139d22f49d1f706173b76fe0b5f680779558f23635a35425154',
  },
];

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
