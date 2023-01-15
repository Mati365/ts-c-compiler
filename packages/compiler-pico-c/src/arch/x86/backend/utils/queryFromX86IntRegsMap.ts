import * as R from 'ramda';

import { X86RegName } from '@x86-toolkit/assembler';
import { X87StackRegName } from '@x86-toolkit/cpu/x87/X87Regs';
import { RegsMap } from '../../constants/regs';

import {
  recursiveX86RegMapLookup,
  X86RegLookupQuery,
} from './recursiveX86RegMapLookup';

import { recursiveSetAvailabilityInX86RegMap } from './recursiveSetAvailabilityInX86RegMap';

export type X86IntRegsMapQueryResult = {
  reg: X86RegName | X87StackRegName;
  availableRegs: RegsMap;
};

export function queryFromX86IntRegsMap(
  query: X86RegLookupQuery,
  availableRegs: RegsMap,
): X86IntRegsMapQueryResult {
  const path = recursiveX86RegMapLookup(query, availableRegs.int);

  if (!path) {
    return null;
  }

  const intRegs = recursiveSetAvailabilityInX86RegMap({
    unavailable: true,
    list: availableRegs.int,
    path,
  });

  return {
    reg: R.last(path).name,
    availableRegs: {
      ...availableRegs,
      int: intRegs,
    },
  };
}
