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

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

async function test() {
  try {
    const txns = await zilliqa.blockchain.getTxnBodiesForTxBlock('1339810');
    if (txns.result === undefined) {
      console.log(txns.error);
    } else {
      console.log(txns.result);
    }
  } catch (e) {
    console.log(e);
  }
}

test();
