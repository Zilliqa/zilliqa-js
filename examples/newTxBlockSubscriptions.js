//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  SocketConnect,
  StatusType,
  MessageType,
} = require('@zilliqa-js/subscriptions');

async function test() {
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    'wss://dev-ws.zilliqa.com',
  );
  subscriber.emitter.on(StatusType.SUBSCRIBE_NEW_BLOCK, (event) => {
    console.log('get SubscribeNewBlock echo: ', event);
  });

  subscriber.emitter.on(MessageType.NEW_BLOCK, (event) => {
    console.log('get new block: ', event.value.TxBlock.header);
  });

  subscriber.emitter.on(MessageType.UNSUBSCRIBE, (event) => {
    console.log('get unsubscribe event: ', event);
  });

  subscriber.emitter.on(SocketConnect.CLOSE, (event) => {
    console.log('get socket close: ', event);
  });

  subscriber.emitter.on(SocketConnect.ERROR, (event) => {
    console.log('get socket error: ', event);
  });

  await subscriber.start();
  // await subscriber.stop();
}

test();
