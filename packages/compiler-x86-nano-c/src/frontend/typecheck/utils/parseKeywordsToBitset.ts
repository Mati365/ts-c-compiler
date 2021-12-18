import * as R from 'ramda';

import {Result, err, ok, tryReduce} from '@compiler/core/monads';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';

/**
 * Transforms array of keywords into bitset
 *
 * @example
 *  ['long', 'short'] => 0b0110
 *
 * @static
 * @param {Record<string, number>} bitmap
 * @param {string[]} keywords
 * @return {Result<number, CTypeCheckError>}
 * @return {CTypeCheckErrorCode}
 */
export function parseKeywordsToBitset(
  {
    bitmap,
    keywords,
    errorCode,
  }: {
    bitmap: Record<string, number>,
    keywords: string[],
    errorCode: CTypeCheckErrorCode,
  },
): Result<number, CTypeCheckError> {
  return tryReduce(
    (acc, keyword) => {
      const bitFlag: number = bitmap[keyword] as any;

      // do not allow to redefine specifier! it is syntax error!
      if (R.isNil(bitFlag) || (acc & bitFlag) !== 0) {
        return err(
          new CTypeCheckError(errorCode),
        );
      }

      return ok(acc | bitFlag);
    },
    0,
    keywords || [],
  );
}
