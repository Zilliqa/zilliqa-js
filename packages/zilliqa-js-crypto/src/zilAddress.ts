import { validation } from '@zilliqa-js/util';
import {
  isValidChecksumAddress,
  decodeBase58,
  toChecksumAddress,
  encodeBase58,
} from './util';
import { toBech32Address, fromBech32Address } from './bech32';

/**
 * @enum AddressType
 */
enum AddressType {
  bytes20 = 'bytes20',
  bytes20Hex = 'bytes20Hex',
  checkSum = 'checkSum',
  base58 = 'base58',
  bech32 = 'bech32',
  bech32TestNet = 'bech32TestNet',
}

class ZilAddress {
  static isValidBech32(address: string) {
    return new ZilAddress(address).isBech32();
  }

  static isValidBech32TestNet(address: string) {
    return new ZilAddress(address).isBech32TestNet();
  }

  static isValidBase58(address: string) {
    return new ZilAddress(address).isBase58();
  }

  static isValidChecksum(address: string) {
    return new ZilAddress(address).isChecksum();
  }

  static isValidByte20(address: string) {
    return new ZilAddress(address).isBytes20();
  }

  static isValidByte20Hex(address: string) {
    return new ZilAddress(address).isBytes20Hex();
  }

  raw: string;

  addressType?: AddressType;

  bytes20: string;

  get bytes20Hex(): string {
    return `0x${this.bytes20}`;
  }

  get checkSum(): string {
    return toChecksumAddress(this.bytes20);
  }

  get bech32(): string {
    return toBech32Address(this.bytes20);
  }
  get bech32TestNet(): string {
    return toBech32Address(this.bytes20, 'tzil');
  }

  get base58(): string {
    return encodeBase58(this.bytes20);
  }

  constructor(raw: string) {
    this.raw = raw;
    this.bytes20 = '0x';
    this.getAddressType();
  }
  isBytes20() {
    return this.addressType === AddressType.bytes20;
  }
  isBytes20Hex() {
    return this.addressType === AddressType.bytes20Hex;
  }
  isChecksum() {
    return this.addressType === AddressType.checkSum;
  }
  isBase58() {
    return this.addressType === AddressType.base58;
  }
  isBech32() {
    return this.addressType === AddressType.bech32;
  }
  isBech32TestNet() {
    return this.addressType === AddressType.bech32TestNet;
  }

  private getAddressType() {
    const addrBool = validation.isAddress(this.raw);
    const base58Bool = validation.isBase58(this.raw);
    const bech32Bool = validation.isBech32(this.raw);
    const bech32TestNetBool = validation.isBech32TestNet(this.raw);
    const checksumBool = isValidChecksumAddress(this.raw);

    if (addrBool === true && checksumBool === false) {
      this.addressType = AddressType.bytes20;
      this.bytes20 = this.raw.startsWith('0x')
        ? this.raw.substring(2)
        : this.raw;
      return;
    }

    if (addrBool === true && checksumBool === true) {
      this.addressType = AddressType.checkSum;
      this.bytes20 = this.raw.toLowerCase().substring(2);
      return;
    }

    if (
      bech32TestNetBool === true &&
      validation.isAddress(fromBech32Address(this.raw, 'tzil'))
    ) {
      this.addressType = AddressType.bech32;
      const decoded = fromBech32Address(this.raw, 'tzil').toLowerCase();
      this.bytes20 = decoded.startsWith('0x') ? decoded.substring(2) : decoded;
      return;
    }

    if (
      bech32Bool === true &&
      validation.isAddress(fromBech32Address(this.raw))
    ) {
      this.addressType = AddressType.bech32;
      const decoded = fromBech32Address(this.raw).toLowerCase();
      this.bytes20 = decoded.startsWith('0x') ? decoded.substring(2) : decoded;
      return;
    }

    if (base58Bool === true && validation.isAddress(decodeBase58(this.raw))) {
      this.addressType = AddressType.base58;
      const decoded = decodeBase58(this.raw).toLowerCase();
      this.bytes20 = decoded.startsWith('0x') ? decoded.substring(2) : decoded;
      return;
    }
    throw new Error('unknown address');
  }
}

export { ZilAddress, AddressType };
