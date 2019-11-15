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
