import {
  X86SegmentRegName,
  InstructionArgSizeName,
} from '@ts-c-compiler/x86-assembler';

export type GenMemAddressConfig = {
  size?: InstructionArgSizeName;
  segment?: X86SegmentRegName;
  expression: string;
  offset?: number;
};

export function genMemAddress({
  size,
  segment,
  expression,
  offset,
}: GenMemAddressConfig): string {
  let output = expression;

  if (segment) {
    output = `${segment}:${expression}`;
  }

  if (offset) {
    output += ` ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}`;
  }

  output = `[${output}]`;

  if (size) {
    output = `${size} ${output}`;
  }

  return output;
}
