import {HTTPProvider} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import {Contracts} from '../index';
import {testContract} from './fixtures';
import {abi} from './test.abi';

const provider = new HTTPProvider(
  'http://a180b4d13c2ec11e898940694eb531e8-907388293.us-west-2.elb.amazonaws.com',
);
const contracts = new Contracts(provider, new Wallet([]));

describe.skip('[Integration]: Contracts', () => {
  it('should be able to deploy a contract', async () => {
    // const contract = await contracts.new(testAbi, testContract);
    // contract.on()
  });
});
