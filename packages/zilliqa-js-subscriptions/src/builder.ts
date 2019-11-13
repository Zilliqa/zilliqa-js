import { NewTxBlockSubscription } from './newblock';
import { NewEventSubscription } from './newevent';

export class SubscriptionBuilder {
  buildNewBlockSubscriptions(url: string) {
    return new NewTxBlockSubscription(url);
  }

  buildEventLogSubscriptions(url: string, options: any = {}) {
    return new NewEventSubscription(url, options);
  }
}
