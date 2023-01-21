import { X86RegName } from '@x86-toolkit/assembler';

export function genRelAddress(
  reg: X86RegName,
  offset: number,
  suffix?: string,
) {
  let offsetSuffix = '';
  if (offset) {
    offsetSuffix = ` ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}`;
  }

  return `[${reg}${offsetSuffix}${suffix || ''}]`;
}
