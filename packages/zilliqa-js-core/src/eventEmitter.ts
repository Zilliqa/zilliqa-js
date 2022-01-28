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

import mitt from 'mitt';

class EventEmitter<T> {
  off: (type: string, handler: mitt.Handler) => void;
  emit: (type: string, event?: any) => void;
  promise: Promise<T>;
  resolve?: (value: T | PromiseLike<T>) => void;
  reject?: (reason?: any) => void;
  then?: any;
  private handlers?: any = {};
  private emitter: mitt.Emitter;
  constructor() {
    this.emitter = new mitt(this.handlers);
    this.off = this.emitter.off.bind(this);
    this.emit = this.emitter.emit.bind(this);
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.then = this.promise.then.bind(this.promise);
  }

  resetHandlers() {
    for (const i in this.handlers) {
      delete this.handlers[i];
    }
  }
  on(type: string, handler: mitt.Handler) {
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

export { EventEmitter };
