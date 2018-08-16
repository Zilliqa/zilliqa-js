import elliptic from 'elliptic';
import BN from 'bn.js';
import {pairs} from './keypairs.fixtures';
import Znode from '../node';
import jestFetch from 'jest-fetch-mock';

const secp256k1 = elliptic.ec('secp256k1');
const node = new Znode({url: 'http://localhost:4201'});
const fetchMock = fetch as typeof jestFetch;

describe('node', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should be able to broadcast a well-formed transaction', (done) => {
    const privateKey = pairs[1].private;
    const publicKey = secp256k1
      .keyFromPrivate(privateKey, 'hex')
      .getPublic(true, 'hex');

    const tx = {
      version: 8,
      nonce: 8,
      to: pairs[0].digest.slice(0, 40),
      from: pairs[1].digest.slice(0, 40),
      pubKey: publicKey,
      amount: new BN('888', 10),
      gasPrice: 8,
      gasLimit: 88,
      code: '',
      data: '',
    };

    // setup mock response here
    const response = JSON.stringify({some: 'random_data'});
    fetchMock.mockResponseOnce(response);

    node.createTransaction(tx, (err, res) => {
      expect(err).toBeFalsy();
      expect(JSON.stringify(res)).toEqual(response);
      done();
    });
  });
});
