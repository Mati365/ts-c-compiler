/// <reference path="./utils/types.d.ts" />

import * as R from 'ramda';

import {asm} from '../src/asm';
import {arrayToHexString} from '../../compiler-core/src/utils/arrayToHexString';

import TIMES_TEST_LIST from './asm/times.asm';
import TETROS_TEST_LIST from './asm/tetros.asm';
import MACROS_TEST_LIST from './asm/macros.asm';
import OPERANDS_TEST_LIST from './asm/operands.asm';
import EQU_BIN_TESTS_LIST from './asm/equ.asm';
import DB_BIN_TESTS_LIST from './asm/db.asm';
import VARIOUS_BIN_TESTS_LIST from './asm/various.asm';
import ARITHMETIC_BIN_TEST from './asm/arithmetic.asm';
import JUMPS_BIN_TEST from './asm/jumps.asm';

import {parseBinaryTestList} from './utils/parseBinaryTestList';

import './utils/asmMatcher';

const tests = parseBinaryTestList(
  [
    TIMES_TEST_LIST,
    TETROS_TEST_LIST,
    MACROS_TEST_LIST,
    OPERANDS_TEST_LIST,
    EQU_BIN_TESTS_LIST,
    DB_BIN_TESTS_LIST,
    VARIOUS_BIN_TESTS_LIST,
    ARITHMETIC_BIN_TEST,
    JUMPS_BIN_TEST,
  ].join('\n'),
);

describe('binary output compare', () => {
  R.forEach(
    ({test, bin, code}) => it(test, () => {
      const result = asm(code);

      expect(
        arrayToHexString(result.unwrap().output.getBinary(), ''),
      ).toBe(bin);
    }),
    tests,
  );
});
