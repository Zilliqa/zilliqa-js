import { validation } from '@zilliqa-js/util';

import { toChecksumAddress } from './util';

// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: Buffer): number {
  var chk = 1;
  for (var p = 0; p < values.length; ++p) {
    var top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[p];
    for (var i = 0; i < 5; ++i) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function hrpExpand(hrp: string): Buffer {
  var ret = [];
  var p;
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return Buffer.from(ret);
}

function verifyChecksum(hrp: string, data: Buffer) {
  return polymod(Buffer.concat([hrpExpand(hrp), data])) === 1;
}

function createChecksum(hrp: string, data: Buffer) {
  const values = Buffer.concat([
    Buffer.from(hrpExpand(hrp)),
    data,
    Buffer.from([0, 0, 0, 0, 0, 0]),
  ]);
  // var values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  var mod = polymod(values) ^ 1;
  var ret = [];
  for (var p = 0; p < 6; ++p) {
    ret.push((mod >> (5 * (5 - p))) & 31);
  }
  return Buffer.from(ret);
}

export function encode(hrp: string, data: Buffer) {
  const combined = Buffer.concat([data, createChecksum(hrp, data)]);
  var ret = hrp + '1';
  for (var p = 0; p < combined.length; ++p) {
    ret += CHARSET.charAt(combined[p]);
  }
  return ret;
}

export function decode(bechString: string) {
  var p;
  var has_lower = false;
  var has_upper = false;
  for (p = 0; p < bechString.length; ++p) {
    if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
      return null;
    }
    if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
      has_lower = true;
    }
    if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
      has_upper = true;
    }
  }
  if (has_lower && has_upper) {
    return null;
  }
  bechString = bechString.toLowerCase();
  var pos = bechString.lastIndexOf('1');
  if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
    return null;
  }
  var hrp = bechString.substring(0, pos);
  var data = [];
  for (p = pos + 1; p < bechString.length; ++p) {
    var d = CHARSET.indexOf(bechString.charAt(p));
    if (d === -1) {
      return null;
    }
    data.push(d);
  }

  if (!verifyChecksum(hrp, Buffer.from(data))) {
    return null;
  }

  return { hrp: hrp, data: Buffer.from(data.slice(0, data.length - 6)) };
}

// HRP is the human-readable part of zilliqa bech32 addresses
const HRP = 'zil';

/**
 * convertBits
 *
 * groups buffers of a certain width to buffers of the desired width.
 *
 * For example, converts byte buffers to buffers of maximum 5 bit numbers,
 * padding those numbers as necessary. Necessary for encoding Ethereum-style
 * addresses as bech32 ones.
 *
 * @param {Buffer} data
 * @param {number} fromWidth
 * @param {number} toWidth
 * @param {boolean} pad
 * @returns {Buffer|null}
 */
export const convertBits = (
  data: Buffer,
  fromWidth: number,
  toWidth: number,
  pad: boolean = true,
) => {
  var acc = 0;
  var bits = 0;
  var ret = [];
  var maxv = (1 << toWidth) - 1;
  for (var p = 0; p < data.length; ++p) {
    var value = data[p];
    if (value < 0 || value >> fromWidth !== 0) {
      return null;
    }
    acc = (acc << fromWidth) | value;
    bits += fromWidth;
    while (bits >= toWidth) {
      bits -= toWidth;
      ret.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      ret.push((acc << (toWidth - bits)) & maxv);
    }
  } else if (bits >= fromWidth || (acc << (toWidth - bits)) & maxv) {
    return null;
  }

  return Buffer.from(ret);
};

/**
 * toBech32Address
 *
 * Encodes a canonical 20-byte Ethereum-style address as a bech32 zilliqa
 * address.
 *
 * The expected format is zil1<address><checksum> where address and checksum
 * are the result of bech32 encoding a Buffer containing the address bytes.
 *
 * @param {string} 20 byte canonical address
 * @returns {string} 38 char bech32 encoded zilliqa address
 */
export const toBech32Address = (address: string): string => {
  if (!validation.isAddress(address)) {
    throw new Error('Invalid address format.');
  }

  const addrBz = convertBits(
    Buffer.from(address.replace('0x', ''), 'hex'),
    8,
    5,
  );

  if (addrBz === null) {
    throw new Error('Could not convert byte Buffer to 5-bit Buffer');
  }

  return encode(HRP, addrBz);
};

/**
 * fromBech32Address
 *
 * @param {string} address - a valid Zilliqa bech32 address
 * @returns {string} a canonical 20-byte Ethereum-style address
 */
export const fromBech32Address = (address: string): string => {
  const res = decode(address);

  if (res === null) {
    throw new Error('Invalid bech32 address');
  }

  const { hrp, data } = res;

  if (hrp !== HRP) {
    throw new Error(`Expected hrp to be ${HRP} but got ${hrp}`);
  }

  const buf = convertBits(data, 5, 8, false);

  if (buf === null) {
    throw new Error('Could not convert buffer to bytes');
  }

  return toChecksumAddress(buf.toString('hex'));
};
