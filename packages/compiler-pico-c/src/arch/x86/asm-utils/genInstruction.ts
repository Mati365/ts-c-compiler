import * as R from 'ramda';
import { X86PrefixName } from '@x86-toolkit/assembler';

export function genInstruction(
  mnemonic: [X86PrefixName, string] | string,
  ...args: (number | string)[]
): string {
  const [prefix, name] = R.is(String, mnemonic) ? [null, mnemonic] : mnemonic;

  const code = [prefix, name, args && R.reject(R.isNil, args).join(', ')]
    .filter(Boolean)
    .join(' ');

  return code;
}
