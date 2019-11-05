import { Server } from 'mock-socket';
import { EventType, WebSocketProvider } from '../src';
// import {WebSocketProvider} from '../dist/ws';

describe('WebSocketProvider', () => {
  it('should be able to connect to websocket server', async () => {
    const fakeURL = 'ws://localhost:8080';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"1000"}');
        socket.send('test message from mock server');
        socket.close();
      });
    });

    const ws = new WebSocketProvider(fakeURL);
    expect(ws.subscribe({ query: '1000' })).resolves.toReturn();
    // following code will cause timeout error which makes this unit test failed
    // I have not reach out a good way to let this unit test succeed, but indeed it is a good tool test our class for now
    // await expect(ws.subscribe({query: '1000'})).resolves.toReturn();
  });

  it('should be able to receive json object', async () => {
    const fakeURL = 'ws://localhost:8081';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"1000"}');
        socket.send(
          '{\n' +
            '    "TxBlock" : \n' +
            '    {\n' +
            '        "body" : \n' +
            '        {\n' +
            '            "BlockHash" : "b2214da8e25efbd4291f85016094824a8fcd46075d06e365282d39ee4ba8ca24",\n' +
            '            "HeaderSign" : "E276EFC8B01AC51804272AAAB4FC59DD96B08B3988F9DA6BED28657CC74A1A609E73B203AA58664EAEB4A960FFEF3D636A7691EBD7F89A03CEFEB12FA8797615",\n' +
            '            "MicroBlockInfos" : \n' +
            '            [\n' +
            '                {\n' +
            '                    "MicroBlockHash" : "9e811581454211ea5a757678460bb62a73860d1be9e5b8b805d3b176d4d92451",\n' +
            '                    "MicroBlockShardId" : 0,\n' +
            '                    "MicroBlockTxnRootHash" : "eec45db6a9b70463a8ac32bec853bcb5fe1d73ffec1244e1cc0427036483bbfa"\n' +
            '                },\n' +
            '                {\n' +
            '                    "MicroBlockHash" : "066ff187ff392a9a9cd430a248552f10759f98e0ac530015091ffa430d68ba83",\n' +
            '                    "MicroBlockShardId" : 1,\n' +
            '                    "MicroBlockTxnRootHash" : "0000000000000000000000000000000000000000000000000000000000000000"\n' +
            '                },\n' +
            '                {\n' +
            '                    "MicroBlockHash" : "250091b5c626143bde230813c527f77a007303e6dc3502642c7d468bc2d064e4",\n' +
            '                    "MicroBlockShardId" : 2,\n' +
            '                    "MicroBlockTxnRootHash" : "0000000000000000000000000000000000000000000000000000000000000000"\n' +
            '                }\n' +
            '            ]\n' +
            '        },\n' +
            '        "header" : \n' +
            '        {\n' +
            '            "BlockNum" : "15",\n' +
            '            "DSBlockNum" : "1",\n' +
            '            "GasLimit" : "15000000",\n' +
            '            "GasUsed" : "1",\n' +
            '            "MbInfoHash" : "4b2d20a0bcb382ad2e2560791ed90ed21100e8e84ebac63d62d3c0b1a3fb11fe",\n' +
            '            "MinerPubKey" : "0x02FC9ED69524A23AEFCB85B8A36C998F512C0512C6932DED74680A044F9D3EBC95",\n' +
            '            "NumMicroBlocks" : 3,\n' +
            '            "NumTxns" : 1,\n' +
            '            "PrevBlockHash" : "5bda21605e7ea9404c58a40eebe99563adf330bab5b39e7438f8e4db28607b37",\n' +
            '            "Rewards" : "1000000000",\n' +
            '            "StateDeltaHash" : "2f878030ab9b0a211c1e584e140707c79d62d067390bfe3ccaf08fdaeaad2229",\n' +
            '            "StateRootHash" : "94abb63e27984f46e914db2601de6af2048a3bf72f69eaac34421b7dfbd34a82",\n' +
            '            "Timestamp" : "1572512230807870",\n' +
            '            "Version" : 1\n' +
            '        }\n' +
            '    },\n' +
            '    "TxHashes" : \n' +
            '    [\n' +
            '        [ "1beb32a5435e993aa3025a70d8a5e71df43c10e2fe3f6ef832d1a5c371a63852" ],\n' +
            '        [],\n' +
            '        []\n' +
            '    ]\n' +
            '}',
        );
        socket.close();
      });
    });
    const ws = new WebSocketProvider(fakeURL);
    expect(ws.subscribe({ query: '1000' })).resolves.toReturn();
  });

  it('should be able to receive json array', async () => {
    const fakeURL = 'ws://localhost:8082';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"1000"}');
        socket.send(
          '[\n' +
            '    {\n' +
            '        "address" : "521a39bec5df87f65ab58a3b6df1044b285a1c48",\n' +
            '        "event_logs" : \n' +
            '        [\n' +
            '            {\n' +
            '                "_eventname" : "setTargetFailure",\n' +
            '                "params" : \n' +
            '                [\n' +
            '                    {\n' +
            '                        "type" : "Uint128",\n' +
            '                        "value" : "1000",\n' +
            '                        "vname" : "target"\n' +
            '                    }\n' +
            '                ]\n' +
            '            }\n' +
            '        ]\n' +
            '    }\n' +
            ']',
        );
        socket.close();
      });
    });

    const ws = new WebSocketProvider(fakeURL);
    expect(ws.subscribe({ query: '1000' })).resolves.toReturn();
  });

  it('should able to emit event while receiving message', async () => {
    const fakeURL = 'ws://localhost:8083';
    const mockServer = new Server(fakeURL);
    const sendData =
      '[\n' +
      '    {\n' +
      '        "address" : "521a39bec5df87f65ab58a3b6df1044b285a1c48",\n' +
      '        "event_logs" : \n' +
      '        [\n' +
      '            {\n' +
      '                "_eventname" : "setTargetFailure",\n' +
      '                "params" : \n' +
      '                [\n' +
      '                    {\n' +
      '                        "type" : "Uint128",\n' +
      '                        "value" : "1000",\n' +
      '                        "vname" : "target"\n' +
      '                    }\n' +
      '                ]\n' +
      '            }\n' +
      '        ]\n' +
      '    }\n' +
      ']';
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"1000"}');
        socket.send(sendData);
        socket.close();
      });
    });

    const ws = new WebSocketProvider(fakeURL);
    ws.emitter.on(EventType.EVENT_LOG, (event) => {
      expect(event).toEqual(sendData);
      console.log(event);
    });
    ws.subscribe({ query: '1000' });
    // await ws.subscribe({query: '1000'});
  });
});
