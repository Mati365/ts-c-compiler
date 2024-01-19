import * as R from 'ramda';

import {
  COMPILER_REGISTERS_SET,
  RegisterSchema,
  InstructionPrefix,
} from '../../../constants';

/**
 * Lookups in InstructionPrefix and finds matching prefix
 * if not found - return null
 */
export function findMatchingSregPrefix(sreg: RegisterSchema): number {
  return InstructionPrefix[R.toUpper(sreg.mnemonic)] ?? null;
}

/**
 * Returns true if prefix is segment register (ds, es etc.)
 */
export function isSregPrefix(prefix: string): boolean {
  return !R.isNil(COMPILER_REGISTERS_SET[R.toLower(prefix)]);
}

/**
 * Returns true if list of prefixes contains at least one sregister
 */
export function containsSregPrefixes(prefixes: number[]): boolean {
  return R.any(prefix => isSregPrefix(InstructionPrefix[prefix]), prefixes);
}
