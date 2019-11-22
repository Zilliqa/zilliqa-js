const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  SocketConnect,
  StatusType,
  MessageType,
} = require('@zilliqa-js/subscriptions');

async function test() {
  // first run `python websocket.py` to start websocket server locally
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    'ws://',
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
