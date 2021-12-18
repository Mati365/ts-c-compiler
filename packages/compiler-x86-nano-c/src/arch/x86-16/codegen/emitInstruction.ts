import * as R from 'ramda';
import {X86PrefixName} from '@compiler/x86-assembler';
import {EmitterResult} from '../constants/types/emitter';

/**
 * Emits single instruction
 *
 * @export
 * @param {([X86PrefixName, string] | string)} mnemonic
 * @param {(...(number | string | EmitterResult)[])} args
 * @returns {EmitterResult}
 */
export function emitInstruction(
  mnemonic: [X86PrefixName, string] | string,
  ...args: (number | string | EmitterResult)[]
): EmitterResult {
  const [prefix, name] = (
    R.is(String, mnemonic)
      ? [null, mnemonic]
      : mnemonic
  );

  const code = [
    prefix,
    name,
    args && (
      R
        .reject(R.isNil, args)
        .map((arg) => (
          typeof arg === 'object'
            ? (<EmitterResult> arg).code
            : arg
        ))
        .join(', ')
    ),
  ]
    .filter(Boolean)
    .join(' ');

  return {
    code,
  };
}
