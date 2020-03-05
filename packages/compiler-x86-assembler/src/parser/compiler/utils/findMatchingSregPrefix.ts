import * as R from 'ramda';

import {InstructionPrefix} from '../../../constants';
import {RegisterSchema} from '../../../shared/RegisterSchema';

/**
 * Lookups in InstructionPrefix and finds matching prefix
 * if not found - return null
 *
 * @param {string} sreg
 * @returns {number}
 */
export function findMatchingSregPrefix(sreg: RegisterSchema): number {
  return R.defaultTo(null, InstructionPrefix[`SREG_${R.toUpper(sreg.mnemonic)}`]);
}
