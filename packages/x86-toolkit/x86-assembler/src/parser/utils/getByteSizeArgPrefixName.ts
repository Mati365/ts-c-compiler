import { $enum } from 'ts-enum-util';
import { InstructionArgSize } from '../../types';

const ARG_SIZE_NAMES_ENTRIES = $enum(InstructionArgSize).getEntries();

/**
 * Return type name "WORD" | "BYTE" etc depending on size
 */
export function getByteSizeArgPrefixName(byteSize: number): string {
  let lastArg: (typeof ARG_SIZE_NAMES_ENTRIES)[0][0];

  for (let i = 0; i < ARG_SIZE_NAMES_ENTRIES.length; ++i) {
    const arg = ARG_SIZE_NAMES_ENTRIES[i];
    if (arg[1] > byteSize) {
      break;
    }

    lastArg = arg[0];
  }

  return lastArg.toLowerCase();
}
