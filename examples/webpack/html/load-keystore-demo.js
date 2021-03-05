async function test() {
    const zilliqa = new Zilliqa.Zilliqa('https://dev-api.zilliqa.com');
    const keystore = `{"address":"0x3591c6b333776a5b6c885Ada53b4462dEe8c67B6","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"1b23d4a09fa241b9cbe176fbc7d9567f"},"ciphertext":"40cce0a0b4eee4e4258341e18d880ff4b12ed25887252b90b7de4b6be86da5d5","kdf":"scrypt","kdfparams":{"salt":"4997f389a370424072967f6faeb709c238ff3cc3606a4101fc3dcbdd74b67108","n":8192,"c":262144,"r":8,"p":1,"dklen":32},"mac":"97f0677a9f0ad0c6052896e1b5ae94f86025047b9fe2617c1fce220af0db0e82"},"id":"39626239-3338-4138-b662-363663333030","version":3}`;
    const keystoreAddress = await zilliqa.wallet.addByKeystore(keystore, "strong_password");
    const exportedKeystore = await zilliqa.wallet.export("0x3591c6b333776a5b6c885Ada53b4462dEe8c67B6", "strong_password", 'scrypt');

    console.log("keystore loaded - address: %o", keystoreAddress);
    console.log("exported keystore: %o", exportedKeystore);
}

  test();