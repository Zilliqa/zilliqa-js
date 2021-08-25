# @zilliqa-js/util

> Utility functions useful in Zilliqa-related programs.

## Classes

### `BN`

See documentation at [bn.js](https://github.com/indutny/bn.js/). This is
simply a re-export of that library to prevent bloating other `@zilliqa-js`
packages, most of which depend on `bn.js` in small ways.

### `Long`

See documentation at [long.js](https://github.com/dcodeIO/long.js). This is
simply a re-export for similar reasons. Note that `long` is only required if
you need to serialise integers with size greater than or equal to `2^53`.

### `PRESETS`

Commonly used variables such as DEVNET_URL. See [source](./src/presets.ts) for more info.

## Functions

### `intToHexArray(int: number, size: number): string[]`

Converts an integer to an array of hexadecimal strings (little endian). Size
is the total length of bytes to pad to.

**Parameters**

- `int`: `number` - the decimal number to convert.

**Returns**

- `string[]` - hexadecimal array representation of the decimal number.

### `intToByteArray(num: number, size: number): Uint8Array`

Converts an integer to a `Uint8Array` (i.e., byte array).

**Parameters**

- `num`: `number` - the decimal number to convert

**Returns**

- `Uint8Array` - byte array, padded to `size`.

### `hexToByteArray(hex: string): Uint8Array`

Converts a hex-encoded `string` to a `Uint8Array`. Endianess is not important.

**Parameters**

- `hex`: `string`

**Returns**

- `Uint8Array`

### `hexToIntArray(hex: string): number[]`

Converts a hex-encoded string to an array of integers.

**Parameters**

- `hex`: `string`

**Returns**

- `number[]`

### `pack(a: number, b: number): number`

Performs bitwise addition of two 16-bit numbers, returning a 32-bit number.
Throws if either number exceeds 16 bits.

**Parameters**

- `a`: `number` - a 16-bit number.
- `b`: `number` - a 16-bit number.

**Returns**

- `number` - the combined 32-bit number.

### `compareBytes(a: string, b: string): boolean`

Performs a constant time comparison of two hexadecimal values. This avoids
timing attacks.

**Parameters**

- `a`: `string` - hex-encoded string.
- `b`: `string` - hex-encoded string.

**Returns**

- `boolean` - `true` if the values are equal.

### `isHex(str: string): boolean`

Determines if a given string is hex-encoded.

**Parameters**

- `str`: `string`.

**Returns**

- `boolean` - `true` if the string is hex-encoded.

### `isAddress(address: string): boolean`

Determines if a given string is a valid address.

**Parameters**

- `address`: `string`.

**Returns**

- `boolean` - `true` if the string is an address.

### `isBech32(address: string): boolean`

Determines if a given string is a valid Zilliqa bech32 address.

**Parameters**

- `address`: `string`.

**Returns**

- `boolean` - `true` if the string is a valid Zilliqa bech32 address.

### `isPrivateKey(privateKey: string): boolean`

Determines if a given string is a valid private key.

**Parameters**

- `privateKey`: `string`.

**Returns**

- `boolean` - `true` if the string is a valid private key.

### `isPubKey(pubKey: string): boolean`

Determines if a given string is a valid _uncompressed_ public key.

**Parameters**

- `pubKey`: `string`.

**Returns**

- `boolean` - `true` if the string is a valid public key.

### `isSignature(sig: string): boolean`

Determines if a given string is a valid Schnorr signature.

**Parameters**

- `sig`: `string`

**Returns**

- `boolean` - `true` if the string is a valid signature.

### `isNumber(x: unknown): boolean`

Determines if a given value is a valid JS `number`.

**Parameters**

- `x`: `unknown`

**Returns**

- `boolean` - `true` if the string is a valid signature.

### `isBN(x: unknown): boolean`

Determines if a given value is an instance of `BN.js`.

**Parameters**

- `x`: `unknown`

**Returns**

- `boolean` - `true` if the value is a `BN` instance.

### `isString(x: unknown): boolean`

Determines if a given value is a valid JS `string`.

**Parameters**

- `x`: `unknown`

**Returns**

- `boolean` - `true` if the value is a `string`.

### `isPlainObject(x: unknown): boolean`

Determines if a given value is a _plain_ JS object (i.e. directly below
`Object` in the prototype chain).

**Parameters**

- `x`: `unknown`

**Returns**

- `boolean` - `true` if the value is a plain object.

### `matchesObject(x: unknown, test: { [key: string]: Validator[] }): boolean`

Determines if a value has the shape specified by `test`.

**Parameters**

- `x`: `unknown`
- `test`: `{ [key: string]: Validator[] }`

**Returns**

- `boolean` - `true` if the value matches `test`.

### `fromQa(qa: BN, unit: Units, options: Options)`

Converts from `qa` (smallest unit) to `zil` or `li`.

**Parameters**

- `qa`: `BN` - the value to convert from.
- `unit`: `Units` - the unit to be converted to (`'zil' | 'qa'`).
- `options`: `Options` - an object specifying options.

### `toQa(input: string | number | BN, unit: Units)`

Converts `zil` or `li` to `qa` (smallest unit).

**Parameters**

- `input`: `string | number | BN` - the value to convert from.
- `unit`: `Units` - the unit to be converted _from_ (`'zil' | 'li'`).
