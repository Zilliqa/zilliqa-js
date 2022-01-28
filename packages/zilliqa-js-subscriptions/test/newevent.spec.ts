//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
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

import { Server } from 'mock-socket';
import { MessageType, QueryParam } from '../src';
import { NewEventSubscription } from '../src';

describe('NewEventSubscription', () => {
  it('should be able to start listen on new event log coming', async () => {
    const fakeURL = 'ws://localhost:8085';
    const mockServer = new Server(fakeURL);
    const epochData =
      '{"type":"Notification","values":[{"query":"NewBlock","value":{"TxBlock":{"body":{"BlockHash":"b2214da8e25efbd4291f85016094824a8fcd46075d06e365282d39ee4ba8ca24","HeaderSign":"E276EFC8B01AC51804272AAAB4FC59DD96B08B3988F9DA6BED28657CC74A1A609E73B203AA58664EAEB4A960FFEF3D636A7691EBD7F89A03CEFEB12FA8797615","MicroBlockInfos":[{"MicroBlockHash":"9e811581454211ea5a757678460bb62a73860d1be9e5b8b805d3b176d4d92451","MicroBlockShardId":0,"MicroBlockTxnRootHash":"eec45db6a9b70463a8ac32bec853bcb5fe1d73ffec1244e1cc0427036483bbfa"},{"MicroBlockHash":"066ff187ff392a9a9cd430a248552f10759f98e0ac530015091ffa430d68ba83","MicroBlockShardId":1,"MicroBlockTxnRootHash":"0000000000000000000000000000000000000000000000000000000000000000"},{"MicroBlockHash":"250091b5c626143bde230813c527f77a007303e6dc3502642c7d468bc2d064e4","MicroBlockShardId":2,"MicroBlockTxnRootHash":"0000000000000000000000000000000000000000000000000000000000000000"}]},"header":{"BlockNum":"15","DSBlockNum":"1","GasLimit":"15000000","GasUsed":"1","MbInfoHash":"4b2d20a0bcb382ad2e2560791ed90ed21100e8e84ebac63d62d3c0b1a3fb11fe","MinerPubKey":"0x02FC9ED69524A23AEFCB85B8A36C998F512C0512C6932DED74680A044F9D3EBC95","NumMicroBlocks":3,"NumTxns":1,"PrevBlockHash":"5bda21605e7ea9404c58a40eebe99563adf330bab5b39e7438f8e4db28607b37","Rewards":"1000000000","StateDeltaHash":"2f878030ab9b0a211c1e584e140707c79d62d067390bfe3ccaf08fdaeaad2229","StateRootHash":"94abb63e27984f46e914db2601de6af2048a3bf72f69eaac34421b7dfbd34a82","Timestamp":"1572512230807870","Version":1}}},"TxHashes":[["1beb32a5435e993aa3025a70d8a5e71df43c10e2fe3f6ef832d1a5c371a63852"],[],[]]},{"query":"EventLog","value":[{"address":"0x0000000000000000000000000000000000000000","event_logs":[{"_eventname":"foo1","params":[{"vname":"bar1","type":"String","value":"abc"},{"vname":"bar2","type":"ByStr32","value":"0x0000000000000000000000000000000000000001"}]}]}]},{"query":"Unsubscribe","value":["NewBlock"]}]}';
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        socket.send(data);
        socket.send(epochData);
        socket.send(epochData);
        socket.send(epochData);
        socket.close();
      });
    });
    const subscriber = new NewEventSubscription(fakeURL, {
      addresses: [
        '0x0000000000000000000000000000000000000000',
        '0x1111111111111111111111111111111111111111',
      ],
    });
    subscriber.emitter.on(MessageType.EVENT_LOG, (event) => {
      expect(event.query).toEqual(QueryParam.EVENT_LOG);
    });
    await subscriber.start();
  });
});
