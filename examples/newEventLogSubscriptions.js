const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { EventType } = require('@zilliqa-js/subscriptions');

async function test() {
  // first run `python websocket.py` to start websocket server locally
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildEventLogSubscriptions(
    'ws://localhost:9997',
    {
      addresses: [
        '0x0000000000000000000000000000000000000000',
        '0x1111111111111111111111111111111111111111',
      ],
    },
  );
  subscriber.emitter.on(EventType.SUBSCRIBE_EVENT_LOG, (event) => {
    console.log('get SubscribeEventLog echo: ', event);
  });
  subscriber.emitter.on(EventType.EVENT_LOG, (event) => {
    console.log('get new event log: ', event);
  });
  subscriber.emitter.on(EventType.UNSUBSCRIBE, (event) => {
    console.log('get unsubscribe event: ', event);
  });

  await subscriber.start();
  await subscriber.stop();
}

test();
