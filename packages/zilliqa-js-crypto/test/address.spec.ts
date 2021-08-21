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

import { addresses } from './address.fixtures';
import { checksummedStore } from './checksum.fixtures';
import * as crypto from '../src/index';

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
