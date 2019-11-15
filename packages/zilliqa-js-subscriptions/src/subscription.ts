//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { WebSocketProvider } from './ws';
import {
  EventType,
  NewBlockQuery,
  NewEventQuery,
  SubscriptionOption,
} from './types';

export class Subscription extends WebSocketProvider {
  subject: NewBlockQuery | NewEventQuery;

  constructor(
    subject: NewBlockQuery | NewEventQuery,
    url: string,
    options?: SubscriptionOption,
  ) {
    super(url, options);
    this.subject = subject;
  }

  async start(): Promise<boolean> {
    return super.subscribe(this.subject);
  }

  async stop() {
    const event =
      this.subject.query === EventType.NEW_BLOCK
        ? {
            query: 'Unsubscribe',
            type: 'NewBlock',
          }
        : { query: 'Unsubscribe', type: 'EventLog' };
    return super.unsubscribe(event);
  }
}
