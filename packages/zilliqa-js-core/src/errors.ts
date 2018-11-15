export const enum Errors {
  // Unknown Error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // Not implemented
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',

  // Missing new operator to an object
  //  - name: The name of the class
  MISSING_NEW = 'MISSING_NEW',

  // Call exception
  //  - transaction: the transaction
  //  - address?: the contract address
  //  - args?: The arguments passed into the function
  //  - method?: The Solidity method signature
  CALL_EXCEPTION = 'CALL_EXCEPTION',

  TIMED_OUT = 'TIMED_OUT',

  // Invalid argument (e.g. value is incompatible with type) to a function:
  //   - arg: The argument name that was invalid
  //   - value: The value of the argument
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',

  // Missing argument to a function:
  //   - count: The number of arguments received
  //   - expectedCount: The number of arguments expected
  MISSING_ARGUMENT = 'MISSING_ARGUMENT',

  // Too many arguments
  //   - count: The number of arguments received
  //   - expectedCount: The number of arguments expected
  UNEXPECTED_ARGUMENT = 'UNEXPECTED_ARGUMENT',

  // Numeric Fault
  //   - operation: the operation being executed
  //   - fault: the reason this faulted
  NUMERIC_FAULT = 'NUMERIC_FAULT',

  // Insufficien funds (< value + gasLimit * gasPrice)
  //   - transaction: the transaction attempted
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',

  // Nonce has already been used
  //   - transaction: the transaction attempted
  NONCE_EXPIRED = 'NONCE_EXPIRED',

  // The replacement fee for the transaction is too low
  //   - transaction: the transaction attempted
  REPLACEMENT_UNDERPRICED = 'REPLACEMENT_UNDERPRICED',

  // Unsupported operation
  //   - operation
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
}

/**
 * ZjsError
 *
 * Custom error for use with ZJS modules.
 *
 * @extends {Error}
 */
export class ZjsError extends Error {
  reason: string = '';
  code: Errors;
  params: { [key: string]: string };

  constructor(
    message: string,
    reason: string,
    code: Errors,
    params: { [key: string]: string } = {},
  ) {
    super(message);
    this.reason = reason;
    this.code = code;
    this.params = params;
  }
}

/**
 * createError
 *
 * Creates a custom ZjsError.
 *
 * This code is adapted from https://github.com/ethers-io/ethers.js/blob/fa68385cfefdc725b4233083e5ba681b8319d78a/src.ts/errors.ts
 *
 * @param {string} reason
 * @param {string} code
 * @param {any} params
 *
 * @returns {ZjsError}
 */
export const createError = (
  reason: string,
  code: Errors = Errors.UNKNOWN_ERROR,
  params: any = {},
): ZjsError => {
  const details = Object.keys(params).map((key) => {
    try {
      return `${key}=${JSON.stringify(params[key])}`;
    } catch (error) {
      return `${key}=${JSON.stringify(params[key].toString())}`;
    }
  });

  const message = `${reason} (${details.join(', ')})`;

  return new ZjsError(message, reason, code, params);
};
