import * as R from 'ramda';
import { $enum } from 'ts-enum-util';

import type { IdentifiersMap } from '@ts-c-compiler/lexer';

export enum CPreprocessorIdentifier {
  DEFINE = '#define',
}

export const C_PREPROCESSOR_IDENTIFIERS_MAP: IdentifiersMap = R.fromPairs(
  $enum(CPreprocessorIdentifier)
    .getValues()
    .map(value => [value, value]),
);
