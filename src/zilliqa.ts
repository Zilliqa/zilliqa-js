// Copyright (c) 2018 Zilliqa
// This source code is being disclosed to you solely for the purpose of your participation in
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to
// the protocols and algorithms that are programmed into, and intended by, the code. You may
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd.,
// including modifying or publishing the code (or any part of it), and developing or forming
// another public or private blockchain network. This source code is provided ‘as is’ and no
// warranties are given as to title or non-infringement, merchantability or fitness for purpose
// and, to the extent permitted by law, all liability for your use of the code is disclaimed.
import Znode from './node';
import {validateArgs} from './util';
import * as util from './util';
import config from './config.json';

interface Options {
  nodeUrl: string;
}

export default class Zilliqa {
  data: {[key: string]: any};
  version: string;
  node: Znode;
  util: Partial<typeof util>;

  constructor(options: Options) {
    this.data = {};
    this.node = new Znode({url: options.nodeUrl || config.defaultNodeUrl});
    this.util = {
      generatePrivateKey: util.generatePrivateKey,
      verifyPrivateKey: util.verifyPrivateKey,
      getAddressFromPrivateKey: util.getAddressFromPrivateKey,
      getPubKeyFromPrivateKey: util.getPubKeyFromPrivateKey,
      createTransactionJson: util.createTransactionJson,
      getAddressFromPublicKey: util.getAddressFromPublicKey,
      isAddress: util.isAddress,
      isPubKey: util.isPubKey,
      intToByteArray: util.intToByteArray,
      compressPublicKey: util.compressPublicKey
    
    };

    this.version = config.version;
  }

  // library methods
  getLibraryVersion = () => {
    return this.version;
  };

  getNode = () => {
    return this.node;
  };

  setNode = (options: Options) => {
    validateArgs(options, {
      nodeUrl: [util.isUrl],
    });

    this.node = new Znode({url: options.nodeUrl || config.defaultNodeUrl});
    return null;
  };
}
