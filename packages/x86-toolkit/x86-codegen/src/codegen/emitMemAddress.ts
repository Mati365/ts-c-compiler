import {
  X86SegmentRegName,
  InstructionArgSizeName,
} from '@x86-toolkit/assembler';

import {EmitterResult} from '../constants/types';

/**
 * Emits single address instruction
 *
 * @export
 * @param {AddressEmitterConfig} {
 *     size,
 *     segment,
 *     expression,
 *   }
 * @returns {EmitterResult}
 */
type AddressEmitterConfig = {
  size?: InstructionArgSizeName,
  segment?: X86SegmentRegName,
  expression: string,
};

export function emitMemAddress(
  {
    size,
    segment,
    expression,
  }: AddressEmitterConfig,
): EmitterResult {
  let output = expression;

  if (segment)
    output = `${segment}:${expression}`;

  output = `[${output}]`;

  if (size)
    output = `${size} ${output}`;

  return {
    code: output,
  };
}
