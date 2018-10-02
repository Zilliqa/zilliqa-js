import {HTTPProvider} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import Blockchain from '../chain';

const provider = new HTTPProvider(
  'http://a180b4d13c2ec11e898940694eb531e8-907388293.us-west-2.elb.amazonaws.com',
);
const bc = new Blockchain(provider, new Wallet([]));

describe('[Integration]: Blockchain', () => {
  it('should be able to get the latest DS block', async () => {
    const response = await bc.getLatestDSBlock();
  });
});
