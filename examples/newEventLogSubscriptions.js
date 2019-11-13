const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { EventType } = require('@zilliqa-js/subscriptions');

async function test() {
  // first run `python websocket.py` to start websocket server locally
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    'ws://localhost:9998',
  );
  subscriber.emitter.on(EventType.SUBSCRIBE_EVENT_LOG, (event) => {
    console.log('get SubscribeEventLog echo: ', event);
  });
  subscriber.emitter.on(EventType.EVENT_LOG, (event) => {
    console.log('get new event log: ', event);
  });
  await subscriber.start();
}

test();
