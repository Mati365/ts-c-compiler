import * as R from 'ramda';
import { $enum } from 'ts-enum-util';

import type { IdentifiersMap } from '@ts-c-compiler/lexer';

export enum CPreprocessorIdentifier {
  DEFINE = '#define',
  IF_DEF = '#ifdef',
  IF_NOT_DEF = '#ifndef',
  IF = '#if',
  ELSE = '#else',
  ELIF = '#elif',
  ELIF_DEF = '#elifdef',
  ELIF_NOT_DEF = '#elifndef',
  ENDIF = '#endif',
}

export const C_PREPROCESSOR_IDENTIFIERS_MAP: IdentifiersMap = R.fromPairs(
  $enum(CPreprocessorIdentifier)
    .getValues()
    .map(value => [value, value]),
);
