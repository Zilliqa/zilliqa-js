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
const { StatusType, MessageType } = require('@zilliqa-js/subscriptions');

async function test() {
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildEventLogSubscriptions(
    'wss://dev-ws.zilliqa.com',
    {
      addresses: [
        '0x2ce491a0fd9e318b39172258101b7c836da7449b',
        '0x167e3980e04eab1e89ff84523ae8c77e008932dc',
      ],
    },
  );
  subscriber.emitter.on(StatusType.SUBSCRIBE_EVENT_LOG, (event) => {
    console.log('get SubscribeEventLog echo: ', event);
  });
  subscriber.emitter.on(MessageType.EVENT_LOG, (event) => {
    console.log('get new event log: ', JSON.stringify(event));
  });
  subscriber.emitter.on(MessageType.UNSUBSCRIBE, (event) => {
    console.log('get unsubscribe event: ', event);
  });

  await subscriber.start();
  // await subscriber.stop();
}

test();
