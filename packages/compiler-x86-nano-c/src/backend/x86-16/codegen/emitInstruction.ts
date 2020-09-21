import * as R from 'ramda';
import {genUUID} from '@compiler/core/utils';
import {X86PrefixName} from '@compiler/x86-assembler/types';

export type EmitterResult = {
  code: string,
};

export type EmitterListResult = EmitterResult | EmitterResult[];

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
  return {
    code: [
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
      .join(' '),
  };
}

export type EmitterLabelResult = EmitterResult & {uuid: string};

/**
 * Generates uuid and generates label
 *
 * @export
 * @param {string} [prefix='_label_']
 * @param {string} defaultUUID
 * @returns {EmitterLabelResult}
 */
export function emitLabel(prefix: string = '@@_', defaultUUID?: string): EmitterLabelResult {
  const uuid = defaultUUID || genUUID(prefix);

  return {
    code: `${uuid}:`,
    uuid,
  };
}
