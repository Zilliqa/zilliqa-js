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

import { NewTxBlockSubscription } from './newblock';
import { NewEventSubscription } from './newevent';
import { SubscriptionOption } from './types';

export class SubscriptionBuilder {
  buildNewBlockSubscriptions(url: string, options?: SubscriptionOption) {
    return new NewTxBlockSubscription(url, options);
  }

  buildEventLogSubscriptions(url: string, options?: SubscriptionOption) {
    return new NewEventSubscription(url, options);
  }
}
