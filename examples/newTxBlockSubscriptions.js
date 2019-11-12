const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { EventType } = require('@zilliqa-js/subscriptions');
const { Server } = require('mock-socket');

async function test() {
  // first run `python websocket.py` to start websocket server locally
  const zilliqa = new Zilliqa(
    'https://dev-api.zilliqa.com',
    'ws://localhost:9998/',
  );
  const subscriber = zilliqa.newTxBlockSubscription;
  subscriber.emitter.on(EventType.SUBSCRIBE_NEW_BLOCK, (event) => {
    console.log('get SubscribeNewBlock echo: ', event);
  });
  subscriber.emitter.on(EventType.NEW_BLOCK, (event) => {
    console.log('get new block: ', event);
  });
  await subscriber.start();
}

test();
