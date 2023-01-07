import { X86RegName } from '@x86-toolkit/assembler';

export function genRelAddress(reg: X86RegName, offset: number) {
  let suffix = '';
  if (offset) {
    suffix = ` ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}`;
  }

  return `[${reg}${suffix}]`;
}
