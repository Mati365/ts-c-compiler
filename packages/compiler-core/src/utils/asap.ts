import { genUUID } from './genUUID';

/**
 * Tiny polyfill for setImmediate
 */
export function asap(fn: () => void | boolean): VoidFunction {
  const eventUUID = genUUID('asap-handler');
  let destroyed = false;

  const post = () => window.postMessage(eventUUID, '*');
  const tick = (e: MessageEvent) => {
    if (destroyed) {
      return;
    }

    if (e.source === window && e.data === eventUUID) {
      if (fn() === false) {
        unmount(); // eslint-disable-line @typescript-eslint/no-use-before-define
        return;
      }

      post();
    }
  };

  window.addEventListener('message', tick);
  post();

  const unmount = () => {
    if (destroyed) {
      return;
    }

    window.removeEventListener('message', tick);
    destroyed = true;
  };

  return unmount;
}
