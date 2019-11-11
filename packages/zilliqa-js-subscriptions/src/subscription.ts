import { WebSocketProvider } from './ws';

export class Subscription extends WebSocketProvider {
  constructor(url: string, options: any = {}) {
    super(url, options);
  }
}
