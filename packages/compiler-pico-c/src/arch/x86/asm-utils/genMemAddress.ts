import {
  X86SegmentRegName,
  InstructionArgSizeName,
  getByteSizeArgPrefixName,
} from '@ts-cc/x86-assembler';

export type GenMemAddressConfig = {
  size?: InstructionArgSizeName | number;
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
    if (typeof size !== 'string') {
      size = getByteSizeArgPrefixName(size);
    }

    output = `${size} ${output}`;
  }

  return output;
}
