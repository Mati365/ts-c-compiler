import {
  X86SegmentRegName,
  InstructionArgSizeName,
} from '@x86-toolkit/assembler';

import {EmitterResult} from '../constants/types';

type GenMemAddressConfig = {
  size?: InstructionArgSizeName,
  segment?: X86SegmentRegName,
  expression: string,
};

export function genMemAddress(
  {
    size,
    segment,
    expression,
  }: GenMemAddressConfig,
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
