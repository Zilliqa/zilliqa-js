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
}

class ZilAddress {
  raw: string;

  addressType?: AddressType;

  bytes20Hex?: string;

  bytes20: string;

  checkSum?: string;

  bech32?: string;

  base58?: string;

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

  private getAddressType() {
    const addrBool = validation.isAddress(this.raw);
    const base58Bool = validation.isBase58(this.raw);
    const bech32Bool = validation.isBech32(this.raw);
    const checksumBool = isValidChecksumAddress(this.raw);

    if (addrBool === true && checksumBool === false) {
      this.addressType = AddressType.bytes20;
      this.bytes20 = this.raw.startsWith('0x')
        ? this.raw.substring(2)
        : this.raw;
      this.normalize();
    } else if (addrBool === true && checksumBool === true) {
      this.addressType = AddressType.checkSum;
      this.bytes20 = this.raw.toLowerCase().substring(2);
      this.normalize();
    } else if (
      bech32Bool === true &&
      validation.isAddress(fromBech32Address(this.raw))
    ) {
      this.addressType = AddressType.bech32;
      const decoded = fromBech32Address(this.raw).toLowerCase();
      this.bytes20 = decoded.startsWith('0x') ? decoded.substring(2) : decoded;
      this.normalize();
    } else if (
      base58Bool === true &&
      validation.isAddress(decodeBase58(this.raw))
    ) {
      this.addressType = AddressType.base58;
      const decoded = decodeBase58(this.raw).toLowerCase();
      this.bytes20 = decoded.startsWith('0x') ? decoded.substring(2) : decoded;
      this.normalize();
    } else {
      throw new Error('unknown address');
    }
  }

  private normalize() {
    this.bytes20Hex = `0x${this.bytes20}`;
    this.checkSum = toChecksumAddress(this.bytes20);
    this.base58 = encodeBase58(this.bytes20);
    this.bech32 = toBech32Address(this.bytes20);
  }
}

export { ZilAddress, AddressType };
