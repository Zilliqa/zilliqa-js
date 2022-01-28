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

export type KDF = 'pbkdf2' | 'scrypt';

export interface PBKDF2Params {
  salt: string;
  dklen: number;
  c: number;
}

export interface ScryptParams {
  salt: string;
  dklen: number;
  n: number;
  r: number;
  p: number;
}

export type KDFParams = PBKDF2Params | ScryptParams;

export interface KeystoreV3 {
  address: string;
  crypto: {
    cipher: string;
    cipherparams: {
      iv: string;
    };
    ciphertext: string;
    kdf: KDF;
    kdfparams: KDFParams;
    mac: string;
  };
  id: string;
  version: 3;
}
