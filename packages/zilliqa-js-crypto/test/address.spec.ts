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

export const addresses = [
  {
    public:
      '0314738163B9BB67AD11AA464FE69A1147DF263E8970D7DCFD8F993DDD39E81BD9',
    private: 'B4EB8E8B343E2CCE46DB4E7571EC1D9654693CCA200BC41CC20148355CA62ED9',
    address: '4BAF5FADA8E5DB92C3D3242618C5B47133AE003C',
  },
  {
    public:
      '034CE268AC5A340038D8ACEBBDD7363611A5B1197916775E32481F5D6B104FAF65',
    private: 'FD906F4A20A0507813FCB0D8D166CF45C1B17F217B776A003B3C3CC628C7E513',
    address: '448261915A80CDE9BDE7C7A791685200D3A0BF4E',
  },
  {
    public:
      '02FA7A501F323CC53E070C0A945370368679E7572960EC24D8A0387EF3B50A2285',
    private: 'C1FE69C394EE8564D0EA525FF74E5F37DF5267CF5C74F2E224757B7D9E594B73',
    address: 'DED02FD979FC2E55C0243BD2F52DF022C40ADA1E',
  },
];

const checksummedStore = [
  {
    original: '4BAF5FADA8E5DB92C3D3242618C5B47133AE003C',
    zil: '0x4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    zil_no0x: '4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    eth: '0x4bAf5fada8E5dB92C3D3242618C5b47133ae003c',
    eth_no0x: '4bAf5fada8E5dB92C3D3242618C5b47133ae003c',
  },
  {
    original: '4BAF5FADA8E5DB92C3D3242618C5B47133AE003C',
    zil: '0x4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    zil_no0x: '4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    eth: '0x4BaF5fADa8E5Db92c3D3242618c5b47133Ae003c',
    eth_no0x: '4BaF5fADa8E5Db92c3D3242618c5b47133Ae003c',
  },
  {
    original: '448261915A80CDE9BDE7C7A791685200D3A0BF4E',
    zil: '0x448261915a80cdE9BDE7C7a791685200D3A0bf4E',
    zil_no0x: '448261915a80cdE9BDE7C7a791685200D3A0bf4E',
    eth_no0x: '448261915a80CDe9bde7C7A791685200d3A0BF4e',
    eth: '0x448261915a80CDe9bde7C7A791685200d3A0BF4e',
  },
];

const bech32Tests = [
  {
    b16: '1d19918a737306218b5cbb3241fcdcbd998c3a72',
    b32: 'zil1r5verznnwvrzrz6uhveyrlxuhkvccwnju4aehf',
  },
  {
    b16: 'cc8ee24773e1b4b28b3cc5596bb9cfc430b48453',
    b32: 'zil1ej8wy3mnux6t9zeuc4vkhww0csctfpznzt4s76',
  },
  {
    b16: 'e14576944443e9aeca6f12b454941884aa122938',
    b32: 'zil1u9zhd9zyg056ajn0z269f9qcsj4py2fc89ru3d',
  },
  {
    b16: '179361114cbfd53be4d3451edf8148cde4cfe774',
    b32: 'zil1z7fkzy2vhl2nhexng50dlq2gehjvlem5w7kx8z',
  },
  {
    b16: '5a2b667fdeb6356597681d08f6cd6636aed94784',
    b32: 'zil1tg4kvl77kc6kt9mgr5y0dntxx6hdj3uy95ash8',
  },
  {
    b16: '537342e5e0a6b402f281e2b4301b89123ae31117',
    b32: 'zil12de59e0q566q9u5pu26rqxufzgawxyghq0vdk9',
  },
  {
    b16: '5e61d42a952d2df1f4e5cbed7f7d1294e9744a52',
    b32: 'zil1tesag25495klra89e0kh7lgjjn5hgjjj0qmu8l',
  },
  {
    b16: '5f5db1c18ccde67e513b7f7ae820e569154976ba',
    b32: 'zil1tawmrsvvehn8u5fm0aawsg89dy25ja46ndsrhq',
  },
];

describe('addresses', () => {
  it('should produce the same results as the C++ keygen crypto', () => {
    addresses.forEach(({ public: pub, private: priv, address }) => {
      const generatedPub = crypto.getPubKeyFromPrivateKey(priv);
      const addressFromPriv = crypto.getAddressFromPrivateKey(priv);
      const addressFromPub = crypto.getAddressFromPrivateKey(priv);
      const checksummedAddress = crypto.toChecksumAddress(address);

      expect(generatedPub.toUpperCase()).toEqual(pub);
      expect(addressFromPriv).toEqual(checksummedAddress);
      expect(addressFromPub).toEqual(checksummedAddress);
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

  it('should throw an error when a non-base 16 address is checksummed', () => {
    expect(() =>
      crypto.toChecksumAddress('zil1amezszdjv3uuu5l49gyynkaa443sure4nxcpvx'),
    ).toThrow();
  });

  it('should encode and decode to and from bech32', () => {
    bech32Tests.forEach(({ b16, b32 }) => {
      expect(crypto.fromBech32Address(b32)).toEqual(
        crypto.toChecksumAddress(b16),
      );
    });
  });
});
