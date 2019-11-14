const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { EventType } = require('@zilliqa-js/subscriptions');

async function test() {
  // first run `python websocket.py` to start websocket server locally
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    'ws://localhost:9997',
  );
  subscriber.emitter.on(EventType.SUBSCRIBE_NEW_BLOCK, (event) => {
    console.log('get SubscribeNewBlock echo: ', event);
  });
  subscriber.emitter.on(EventType.NEW_BLOCK, (event) => {
    console.log('get new block: ', event);
  });
  subscriber.emitter.on(EventType.UNSUBSCRIBE, (event) => {
    console.log('get unsubscribe event: ', event);
  });
  await subscriber.start();
  await subscriber.stop();
}

test();
