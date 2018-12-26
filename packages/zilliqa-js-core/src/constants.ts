// this constant is used to indicate the number of times to poll the
// blockchain for a transaction confirmation. this number has been selected by
// using a heuristic to calculate the approximate maximum amount of time it
// should take for a transaction to be confirmed, even during a PoW submission
// round.
export const GET_TX_ATTEMPTS = 33;
