import {genUUID} from './genUUID';

/**
 * Tiny polyfill for setImmediate
 *
 * @export
 * @param {(() => void|boolean)} fn
 * @returns {VoidFunction}
 */
export function asap(fn: () => void|boolean): VoidFunction {
  const eventUUID = genUUID('asap-handler');

  const post = () => window.postMessage(eventUUID, '*');
  const tick = (e: MessageEvent) => {
    if (e.source === window && e.data === eventUUID) {
      if (fn() === false)
        return;

      post();
    }
  };

  window.addEventListener('message', tick);
  post();

  return () => {
    window.removeEventListener('message', tick);
  };
}
