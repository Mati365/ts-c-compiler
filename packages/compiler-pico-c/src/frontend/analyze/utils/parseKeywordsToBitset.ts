import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { tryReduceEithers } from '@ts-c-compiler/core';
import { CTypeCheckError, CTypeCheckErrorCode } from '../errors/CTypeCheckError';

type KeywordsParserAttrs = {
  bitmap: Record<string, number>;
  keywords: string[];
  errorCode: CTypeCheckErrorCode;
};

/**
 * Transforms array of keywords into bitset
 *
 * @example
 *  ['long', 'short'] => 0b0110
 */
export const parseKeywordsToBitset = ({
  bitmap,
  keywords,
  errorCode,
}: KeywordsParserAttrs): E.Either<CTypeCheckError, number> =>
  tryReduceEithers(
    (acc, keyword) => {
      const bitFlag: number = bitmap[keyword] as any;

      // do not allow to redefine specifier! it is syntax error!
      if (R.isNil(bitFlag) || (acc & bitFlag) !== 0) {
        return E.left(new CTypeCheckError(errorCode));
      }

      return E.right(acc | bitFlag);
    },
    0,
    keywords || [],
  );
