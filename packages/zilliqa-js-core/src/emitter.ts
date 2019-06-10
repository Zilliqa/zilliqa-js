import mitt from 'mitt';

class Emitter {
  handlers?: any = {};
  emitter: mitt.Emitter;
  off: (type: string, handler: mitt.Handler) => void;
  emit: (type: string, event?: any) => void;
  on = this.onListen;
  promise: Promise<{}>;
  resolve?: any;
  reject?: any;
  then?: any;
  constructor() {
    this.emitter = new mitt(this.handlers);
    this.off = this.emitter.off.bind(this);
    this.emit = this.emitter.emit.bind(this);
    // tslint:disable-next-line: no-empty
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.then = this.promise.then.bind(this.promise);
  }

  resetHandlers() {
    // tslint:disable-next-line: forin
    for (const i in this.handlers) {
      delete this.handlers[i];
    }
  }
  onListen(type: string, handler: mitt.Handler) {
    this.emitter.on(type, handler);
    return this;
  }
  once(type: string, handler: mitt.Handler) {
    this.emitter.on(type, (e: any) => {
      handler(e);
      this.removeEventListener(type);
    });
  }

  addEventListener(type: string, handler: mitt.Handler) {
    this.emitter.on(type, handler);
  }

  removeEventListener(type?: string, handler?: mitt.Handler) {
    if (!type) {
      this.handlers = {};
      return;
    }
    if (!handler) {
      delete this.handlers[type];
    } else {
      return this.emitter.off(type, handler);
    }
  }
  onError(error: any) {
    this.emitter.on('error', error);
    this.removeEventListener('*');
  }
  onData(data: any) {
    this.emitter.on('data', data);
    this.removeEventListener('*');
  }
  listenerCount(listenKey: any) {
    let count = 0;
    Object.keys(this.handlers).forEach((val) => {
      if (listenKey === val) {
        count += 1;
      }
    });
    return count;
  }
}

export { Emitter };
