import elliptic from 'elliptic';
import BN from 'bn.js';
import {pairs} from './keypairs.fixtures';
import * as util from '../util';
import Znode from '../node';
import jestFetch from 'jest-fetch-mock';

const secp256k1 = elliptic.ec('secp256k1');
const node = new Znode({url: 'http://localhost:4201'});
const fetchMock = fetch as typeof jestFetch;

const code = '(* HelloWorld contract *)\n\n\n(***************************************************)\n(*               Associated library                *)\n(***************************************************)\nlibrary HelloWorld\n\nlet one_msg = \n  fun (msg : Message) => \n  let nil_msg = Nil {Message} in\n  Cons {Message} msg nil_msg\n\nlet not_owner_code = Int32 1\nlet set_hello_code = Int32 2\n\n(***************************************************)\n(*             The contract definition             *)\n(***************************************************)\n\ncontract HelloWorld\n(owner: Address)\n\nfield welcome_msg : String = ""\n\ntransition setHello (msg : String)\n  is_owner = builtin eq owner _sender;\n  match is_owner with\n  | False =>\n    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; code : not_owner_code};\n    msgs = one_msg msg;\n    send msgs\n  | True =>\n    welcome_msg := msg;\n    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; code : set_hello_code};\n    msgs = one_msg msg;\n    send msgs\n  end\nend\n\n\ntransition getHello ()\n    r <- welcome_msg;\n    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; msg : r};\n    msgs = one_msg msg;\n    send msgs\nend';

describe('node', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should be able to create transactions to 0x0', (done) => {
    const privateKey = pairs[1].private;
    const publicKey = secp256k1
      .keyFromPrivate(privateKey, 'hex')
      .getPublic(true, 'hex');

    // the immutable initialisation variables
    const initParams = [
      {
        vname: 'owner',
        type: 'Address',
        value: '0x1234567890123456789012345678901234567890',
      },
      {
        vname: 'total_tokens',
        type: 'Uint128',
        value: '10000',
      },
    ];

    const tx = {
      version: 8,
      nonce: 8,
      to: '0000000000000000000000000000000000000000',
      from: pairs[1].digest.slice(0, 40),
      pubKey: publicKey,
      amount: new BN('888', 10),
      gasPrice: 8,
      gasLimit: 88,
      code: code,
      data: JSON.stringify(initParams).replace(/\\"/g, '"'),
    };

    const signed = util.createTransactionJson(privateKey, tx);

    const response = JSON.stringify({some: 'random_data'});
    fetchMock.mockResponseOnce(response);
    node.createTransaction(signed, (err, res) => {
      expect(err).toBeFalsy();
      expect(JSON.stringify(res)).toEqual(response);
      done();
    });
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
