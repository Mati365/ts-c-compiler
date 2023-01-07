import * as R from 'ramda';
import { removeNullValues } from '../removeNullValues';

/**
 * Serializes attributes to GET similar format
 */
export function dumpAttributesToString(
  kind: string,
  attrs: Record<string, any>,
): string {
  const serializedAttrs = R.pipe(
    removeNullValues,
    R.mapObjIndexed(R.when(R.is(Boolean), val => +val)),
    R.toPairs as any,
    R.map(([key, value]) => `${key}="${value}"`),
    R.join(' '),
  )(attrs);

  if (R.isNil(kind)) {
    return serializedAttrs;
  }

  return `${kind} ${serializedAttrs}`.trim();
}
