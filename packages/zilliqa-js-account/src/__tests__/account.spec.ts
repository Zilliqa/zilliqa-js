import Account from '../account';
import * as zcrypto from 'zilliqa-js-crypto';

describe('Account', () => {
  it('should be able to encode itself as a keystore file', async () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    const decrypted = await Account.fromFile(keystore, 'stronk_password');
    expect(decrypted.privateKey).toEqual(account.privateKey);
  });

  it('should fail if given the wrong passphrase', async () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    try {
      const decrypted = await Account.fromFile(keystore, 'weak_password');
    } catch (err) {
      expect(err.message).toEqual('Could not decrypt keystore file.');
    }
  });
});
