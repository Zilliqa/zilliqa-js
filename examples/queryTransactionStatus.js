//  Copyright (C) 2020 Zilliqa
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
    const status = await zilliqa.blockchain.getTransactionStatus(
      '96ba63371a57c9d4d7cbf448dbdd78d209c888a76a30413abd72691c16efffbb',
    );
    console.log(status);
  } catch (e) {
    console.log(e);
  }
}

test();
