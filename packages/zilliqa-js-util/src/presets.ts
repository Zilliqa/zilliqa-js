export const enum PRESETS {
  DEVNET_URL = 'https://dev-api.zilliqa.com',
  DEVNET_CHAIN_ID = 333,
  // byte-packed version used for payload versioning
  // DEVNET = bytes.pack(333,1)
  DEVNET_VERSION = 21823489,
  MAINNET_URL = 'https://api.zilliqa.com',
  MAINNET_CHAIN_ID = 1,
  // byte-packed version used for payload versioning
  // MAINNET_VERSION = bytes.pack(1,1)
  MAINNET_VERSION = 65537,
  MSG_VERSION = 1,
}
