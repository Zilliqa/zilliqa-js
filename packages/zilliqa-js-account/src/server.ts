import { Party1 } from '@kzen-networks/thresh-sig';

export class ZilliqaThreshSigServer {
  private p1: Party1;

  constructor() {
    this.p1 = new Party1();
  }

  public launch() {
    this.p1.launchServer();
  }
}
